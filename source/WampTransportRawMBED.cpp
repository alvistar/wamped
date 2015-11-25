#include <iostream>
#include <iomanip>
#include <memory>
#include <sstream>
#include "WampTransportRawMBED.h"
#include "sal-stack-lwip/lwipv4_init.h"

#define DEBUG_WAMP_TRANSPORT

#ifdef DEBUG_WAMP_TRANSPORT
#include "logger.h"
#else
#define LOG(X)
#endif

typedef enum {WAITHANDSHAKE,WAITPREFIX,WAITMSG} stateT;

struct debug {
    debug() {
    }

    ~debug() {
        std::cerr << m_SS.str() << "\r\n";
    }

public:
    // accepts just about anything
    template<class T>
    debug &operator<<(const T &x) {
        m_SS << x;
        return *this;
    }
private:
    std::ostringstream m_SS;
};

std::string toHexString(const unsigned char *data, size_t dataLen, bool format = true) {
    stringstream out;
    out << std::setfill('0');
    for(size_t i = 0; i < dataLen; ++i) {
        out << std::hex << std::setw(2) << (int)data[i];
        if (format) {
            out << (((i + 1) % 16 == 0) ? "\n" : " ");
        }
    }
    return out.str();
}

WampTransportRaw::WampTransportRaw(string host, int port):host(host),port(port)
{
    eth.init();
	eth.connect();
    lwipv4_socket_init();
    LOG ("TCP client IP Address is " << eth.getIPAddress());
    _stream = unique_ptr<TCPStream> (new TCPStream (SOCKET_STACK_LWIP_IPV4));
    _stream->open(SOCKET_AF_INET4);
    _stream->setOnError(TCPStream::ErrorHandler_t(this, &WampTransportRaw::onError));
    _stream->setOnSent(TCPStream::SentHandler_t(this, &WampTransportRaw::onSent));
}

void WampTransportRaw::connect() {
    LOG("Connecting...");

    socket_error_t err = _stream->resolve("192.168.20.192", TCPStream::DNSHandler_t(this, &WampTransportRaw::onDNS));
}

int WampTransportRaw::process() {
    return 0;
}

void WampTransportRaw::sendMessage(string &msg) {
    //
}

//void WampTransportRaw::sendMessage(char* buffer, size_t size) {
//	FunctionPointer2<void, char*, size_t> ptr_to_sendMessage (this, &WampTransporRaw::_sendMessage);
//	minar::Scheduler::postCallBack(ptr_to_sendMessage(buffer,size));
//}

void WampTransportRaw::sendMessage(char* buffer, size_t size) {
    LOG("Sending binary of length " << size);

	char prefix[4];
    socket_error_t err;

    prefix[0] = 0;
    prefix[3] = (char) (size & 0xff);
    prefix[2] = (char) ((size >> 8) & 0xff);
    prefix[1] = (char) ((size >> 16) & 0xff);

    /* Send prefix to the server */
	err = _stream->send(prefix, 4);
    _stream->error_check(err);

    /* Send message to the server */
	err = _stream->send(buffer, size);
    _stream->error_check(err);

}

void WampTransportRaw::onDNS(Socket *s, struct socket_addr addr, const char *domain) {
    /* Check that the result is a valid DNS response */
    if (socket_addr_is_any(&addr)) {
        /* Could not find DNS entry */
        LOG("Could not find DNS entry for %s" << domain);
        //onError(s, SOCKET_ERROR_DNS_FAILED);
    } else {
        /* Start connecting to the remote host */
        char buf[16];
        _remoteAddr.setAddr(&addr);
        _remoteAddr.fmtIPv4(buf,sizeof(buf));
        LOG("DNS Response Received:" << domain << " " << buf);
        LOG("Connecting to: "<< buf << " port:" << port);
        socket_error_t err = _stream->connect(_remoteAddr, (const uint16_t) port, TCPStream::ConnectHandler_t(this, &WampTransportRaw::onSocketConnect));

        if (err != SOCKET_ERROR_NONE) {
            onError(s, err);
        }
    }
}

void WampTransportRaw::onError(Socket *s, socket_error_t err) {
    (void) s;
    LOG("MBED: Socket Error: " << socket_strerror(err) << ":" << err);
    _stream->close();
    onClose();
    // _error = true;

}

void WampTransportRaw::onSocketConnect(TCPStream *s) {
    char buf[16];
    _remoteAddr.fmtIPv4(buf,sizeof(buf));
    LOG("Connected");
    /* Send the request */
    s->setOnReadable(TCPStream::ReadableHandler_t(this, &WampTransportRaw::onReceive));
    s->setOnDisconnect(TCPStream::DisconnectHandler_t(this, &WampTransportRaw::onDisconnect));

    //Handhsake
    char handshake [] = {0x7f, 0x02, 0x00, 0x00};

    /* Send message to the server */
    memcpy(_buffer,handshake,4);

    socket_error_t err = _stream->send(_buffer, 4);
    s->error_check(err);

}

void WampTransportRaw::onReceive(Socket *s) {

//    printf("HTTP Response received.\r\n");
    _bpos = sizeof(_buffer);
//    /* Read data out of the socket */
    socket_error_t err = s->recv(_buffer, &_bpos);
    if (err != SOCKET_ERROR_NONE) {
        onError(s, err);
        return;
    }

    decode(_buffer, _bpos);

}
void WampTransportRaw::onSent(Socket *s, uint16_t nbytes)
{
    (void) s;
    //_unacked -= nbytes;

    LOG("Sent bytes " << nbytes);
}

void WampTransportRaw::decode(char *buffer, int size) {
    static unsigned int byteNumber;
    static stateT state = WAITHANDSHAKE;
    char prefixMSG[4];
    unsigned long int max_len_send;
    unsigned long int msgSize = 0;
    int serializer_type;

    //LOG(DEBUG) << "Decoding Size:" << size << "Payload:" << toHexString((const unsigned char *) buffer, size);

    for (int i = 0; i < size; i++) {
        switch (state) {
            case WAITHANDSHAKE:
                switch (byteNumber) {
                    case 0: //First byte must be 0x7f
                        if (buffer[i] != 0x7f) {
                            LOG("Invalid magic byte");
                        }
                        else {
                            byteNumber++;
                        }
                        break;
                    case 1: //Read max len and streaming size
                        max_len_send = (unsigned long int) pow(2, (9 + ((unsigned char) buffer[i] >> 4)));
                        LOG("Max bytes per message " << max_len_send);
                        serializer_type = buffer[i] & 0x0f;
                        LOG("Serializer  " << serializer_type);
                        byteNumber++;
                        break;
                    case 2: // First reserved byte
                        if (buffer[i] != 0) {
                            LOG("Reserved byte must be zero");
                            byteNumber = 0;
                        }
                        byteNumber++;
                        break;
                    case 3: // Second reserved byte
                        if (buffer[i] != 0) {
                            LOG("Reserved byte must be zero");
                            byteNumber = 0;
                        }
                        state = WAITPREFIX;
                        byteNumber = 0;
                        onConnect();
                        break;

                    default:
                        break;
                }
                break;
            case WAITPREFIX:
                if (byteNumber < 4) {
                    prefixMSG[byteNumber] = buffer[i];
                    byteNumber++;
                    break;
                }
                else {
                    LOG("Prefix " << toHexString((const unsigned char *) prefixMSG, 4));
                    msgSize = ntohl(*((unsigned long *) &prefixMSG));
                    LOG("Msg size: " << msgSize);
                    state = WAITMSG;
                    byteNumber = 0;
                }

            case WAITMSG:
                message[byteNumber] = buffer[i];
                byteNumber++;

                if (byteNumber == msgSize) {
                    LOG("Message: " << message);
                    state = WAITPREFIX;
                    byteNumber = 0;
                    onMessageBin(message, msgSize);
                }

                break;
            default:
                break;
        }
    }
}

void WampTransportRaw::onDisconnect(TCPStream *s) {
    s->close();
    LOG("Disconnected");
}

