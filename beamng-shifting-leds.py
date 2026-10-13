#!/usr/bin/env python3

import socket
import struct
import sys
import threading
import time

import hid  # pip install hidapi

ADDRESS = "127.0.0.1"
PORT = 5555
VID, PID = 0x046D, 0xC266  # Logitech G923

# ====== STATE ======
maxrpm = 7000.0
previous_mask = -1
leds_on = False
last_flash = 0.0


# ====== INPUT ======
def stdin_loop():
    global maxrpm
    for line in sys.stdin:
        try:
            val = float(line.strip())
        except ValueError:
            continue
        if val > 0:
            maxrpm = val
            print("Max RPM set to:", maxrpm)


# ====== HID ======
def open_wheel():
    dev = hid.device()
    try:
        dev.open(VID, PID)
    except (OSError, ValueError) as e:
        print("Could not open Logitech G923 (permissions?)")
        print(e)
        sys.exit(1)
    print("Connected to Logitech G923")
    return dev


def write_leds(dev, mask):
    dev.write([0xF8, 0x12, mask & 0x1F, 0x00, 0x00, 0x00, 0x01])


# ====== LED LOGIC ======
def update_leds(dev, rpm):
    global previous_mask, leds_on, last_flash

    frac = rpm / maxrpm
    now = time.monotonic()

    # Limiter flash
    if frac > 0.93:
        if now - last_flash > 0.1:
            write_leds(dev, 0x00 if leds_on else 0x1F)
            leds_on = not leds_on
            last_flash = now
        return

    mask = 0
    if frac > 0.45:
        mask |= 0x01
    if frac > 0.55:
        mask |= 0x02
    if frac > 0.625:
        mask |= 0x04
    if frac > 0.71:
        mask |= 0x08
    if frac > 0.85:
        mask |= 0x10

    if mask == previous_mask:
        return

    previous_mask = mask
    write_leds(dev, mask)


def main():
    print("Type Max RPM and press ENTER (default 7000)")

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((ADDRESS, PORT))

    dev = open_wheel()
    threading.Thread(target=stdin_loop, daemon=True).start()

    first_time = True
    try:
        while True:
            msg, _ = sock.recvfrom(1024)
            if len(msg) < 20:
                continue
            if first_time:
                print("Connected to BeamNG.Drive")
                first_time = False

            # RPM from OutGauge (little-endian float, offset 16)
            rpm = struct.unpack_from("<f", msg, 16)[0]
            rpm = max(0.0, min(rpm, maxrpm))
            update_leds(dev, rpm)
    except KeyboardInterrupt:
        pass
    finally:
        try:
            write_leds(dev, 0)
        except OSError:
            pass
        dev.close()
        sock.close()


if __name__ == "__main__":
    main()
