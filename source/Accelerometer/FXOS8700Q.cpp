/* FXOS8700Q sensor driver
 * Copyright (c) 2014-2015 ARM Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include "FXOS8700Q.h"

const uint16_t uint14_max = 0x3FFF;
void static inline normalize_14bits(int16_t &x)
{
    x = ((x) > (uint14_max/2)) ? (x - uint14_max) : (x);
}

static int16_t dummy_int16_t = 0;
static float dummy_float = 0.0f;

FXOS8700Q::FXOS8700Q(I2C &i2c, uint8_t addr)
{
    _i2c = &i2c;
    _addr = addr;
    // activate the peripheral
    uint8_t data[2] = {FXOS8700Q_CTRL_REG1, 0x00};
    _i2c->frequency(400000);
    writeRegs(data, 2);
    data[0] = FXOS8700Q_M_CTRL_REG1;
    data[1] = 0x1F;
    writeRegs(data, 2);
    data[0] = FXOS8700Q_M_CTRL_REG2;
    data[1] = 0x20;
    writeRegs(data, 2);
    data[0] = FXOS8700Q_XYZ_DATA_CFG;
    data[1] = 0x00;
    writeRegs(data, 2);
    data[0] = FXOS8700Q_CTRL_REG1;
    data[1] = 0x1C;
    writeRegs(data, 2);
}

FXOS8700Q::~FXOS8700Q()
{
    _i2c = 0;
    _addr = 0;
}

void FXOS8700Q::readRegs(uint8_t addr, uint8_t *data, uint32_t len) const
{
    uint8_t t[1] = {addr};
    _i2c->write(_addr, (char *)t, sizeof(t), true);
    _i2c->read(_addr, (char *)data, len);
}

uint8_t FXOS8700Q::whoAmI() const
{
    uint8_t who_am_i = 0;
    readRegs(FXOS8700Q_WHOAMI, &who_am_i, sizeof(who_am_i));
    return who_am_i;
}

void FXOS8700Q::writeRegs(uint8_t * data, uint32_t len) const
{
    _i2c->write(_addr, (char *)data, len);
}


int16_t FXOS8700Q::getSensorAxis(uint8_t addr) const
{
    uint8_t res[2];
    readRegs(addr, res, sizeof(res));
    return static_cast<int16_t>((res[0] << 8) | res[1]);
}

void FXOS8700Q::enable(void) const
{
    uint8_t data[2];
    readRegs(FXOS8700Q_CTRL_REG1, &data[1], 1);
    data[1] |= 0x01;
    data[0] = FXOS8700Q_CTRL_REG1;
    writeRegs(data, sizeof(data));
}

void FXOS8700Q::disable(void) const
{
    uint8_t data[2];
    readRegs(FXOS8700Q_CTRL_REG1, &data[1], 1);
    data[1] &= 0xFE;
    data[0] = FXOS8700Q_CTRL_REG1;
    writeRegs(data, sizeof(data));
}

uint32_t FXOS8700Q::dataReady(void) const
{
    uint8_t stat = 0;
    readRegs(FXOS8700Q_STATUS, &stat, 1);
    return (uint32_t)stat;
}

uint32_t FXOS8700Q::sampleRate(uint32_t frequency) const
{
    frequency = 50;
    return(50); // for now sample rate is fixed at 50Hz
}

int16_t FXOS8700QAccelerometer::getX(int16_t &x = dummy_int16_t) const
{
    x = getSensorAxis(FXOS8700Q_OUT_X_MSB) >> 2;
    normalize_14bits(x);
    return x;
}

int16_t FXOS8700QAccelerometer::getY(int16_t &y = dummy_int16_t) const
{
    y = getSensorAxis(FXOS8700Q_OUT_Y_MSB) >> 2;
    normalize_14bits(y);
    return y;
}

int16_t FXOS8700QAccelerometer::getZ(int16_t &z = dummy_int16_t) const
{
    z = getSensorAxis(FXOS8700Q_OUT_Z_MSB) >> 2;
    normalize_14bits(z);
    return z;
}

float FXOS8700QAccelerometer::getX(float &x = dummy_float) const
{
    int16_t val = getSensorAxis(FXOS8700Q_OUT_X_MSB) >> 2;
    normalize_14bits(val);
    x = val / 4096.0f;
    return x;
}

float FXOS8700QAccelerometer::getY(float &y = dummy_float) const
{
    int16_t val = getSensorAxis(FXOS8700Q_OUT_Y_MSB) >> 2;
    normalize_14bits(val);
    y = val / 4096.0f;
    return y;
}

float FXOS8700QAccelerometer::getZ(float &z = dummy_float) const
{
    int16_t val = getSensorAxis(FXOS8700Q_OUT_Z_MSB) >> 2;
    normalize_14bits(val);
    z = val / 4096.0f;
    return z;
}

void FXOS8700QAccelerometer::getAxis(motion_data_counts_t &xyz) const
{
    uint8_t res[6];
    readRegs(FXOS8700Q_OUT_X_MSB, res, sizeof(res));
    xyz.x = static_cast<int16_t>((res[0] << 8) | res[1]) >> 2;
    xyz.y = static_cast<int16_t>((res[2] << 8) | res[3]) >> 2;
    xyz.z = static_cast<int16_t>((res[4] << 8) | res[5]) >> 2;
    normalize_14bits(xyz.x);
    normalize_14bits(xyz.y);
    normalize_14bits(xyz.z);
}

void FXOS8700QAccelerometer::getAxis(motion_data_units_t &xyz) const
{
    motion_data_counts_t _xyz;
    FXOS8700QAccelerometer::getAxis(_xyz);
    xyz.x = _xyz.x / 4096.0f;
    xyz.y = _xyz.y / 4096.0f;
    xyz.z = _xyz.z / 4096.0f;
}

int16_t FXOS8700QMagnetometer::getX(int16_t &x = dummy_int16_t) const
{
    x = getSensorAxis(FXOS8700Q_M_OUT_X_MSB);
    return x;
}

int16_t FXOS8700QMagnetometer::getY(int16_t &y = dummy_int16_t) const
{
    y = getSensorAxis(FXOS8700Q_M_OUT_Y_MSB);
    return y;
}

int16_t FXOS8700QMagnetometer::getZ(int16_t &z = dummy_int16_t) const
{
    z = getSensorAxis(FXOS8700Q_M_OUT_Z_MSB);
    return z;
}

float FXOS8700QMagnetometer::getX(float &x = dummy_float) const
{
    x = static_cast<float>(getSensorAxis(FXOS8700Q_M_OUT_X_MSB)) * 0.1f;
    return x;
}

float FXOS8700QMagnetometer::getY(float &y = dummy_float) const
{
    y = static_cast<float>(getSensorAxis(FXOS8700Q_M_OUT_Y_MSB)) * 0.1f;
    return y;
}

float FXOS8700QMagnetometer::getZ(float &z = dummy_float) const
{
    z = static_cast<float>(getSensorAxis(FXOS8700Q_M_OUT_Z_MSB)) * 0.1f;
    return z;
}

void FXOS8700QMagnetometer::getAxis(motion_data_counts_t &xyz) const
{
    uint8_t res[6];
    readRegs(FXOS8700Q_M_OUT_X_MSB, res, sizeof(res));
    xyz.x = (res[0] << 8) | res[1];
    xyz.y = (res[2] << 8) | res[3];
    xyz.z = (res[4] << 8) | res[5];
}

void FXOS8700QMagnetometer::getAxis(motion_data_units_t &xyz) const
{
    motion_data_counts_t _xyz;
    FXOS8700QMagnetometer::getAxis(_xyz);
    xyz.x = static_cast<float>(_xyz.x * 0.1f);
    xyz.y = static_cast<float>(_xyz.y * 0.1f);
    xyz.z = static_cast<float>(_xyz.z * 0.1f);
}
