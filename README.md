# Logitech G923 Shifter LEDs for BeamNG.Drive

A utility that allows the G923's shifter leds to light up based on the car's rpm.

![Shifting Leds on the G923](https://raw.githubusercontent.com/d4rk/ac_shifting_leds/main/images/shifting_leds.png)

# Requirements
- Python 3
- hidapi (`pip install hidapi`)

# Usage
Note: This program has only been tested on Linux.

1. Download `beamng_shifting_leds.py`.

2. Go into a terminal in the folder where you downloaded `beamng_shifting_leds.py` and run `python3 beamng_shifting_leds.py`

3. Launch BeamNG.Drive

4. Go into the settings of BeamNG.Drive and enable outgauge support on port 5555 and address 127.0.0.1 (the default).

5. Enter the max RPM of the car that you are driving into the terminal and press enter. You can set the max RPM of your car anytime.

# Linux permissions
If the program prints `Could not open Logitech G923 (permissions?)`, add a udev rule:

```
echo 'KERNEL=="hidraw*", ATTRS{idVendor}=="046d", ATTRS{idProduct}=="c266", MODE="0666"' | sudo tee /etc/udev/rules.d/99-g923.rules
sudo udevadm control --reload && sudo udevadm trigger
```

Then replug the wheel.

# Credits
- https://github.com/d4rk/ac_shifting_leds for the code to control the leds and inspiration for the readme.
- https://github.com/fuelsoft/out-gauge-cluster for the information on how outgauge works.
- https://github.com/gamingdoom/beamng-shifting-leds for the original project
- https://github.com/bun1a-dev/beamng-shifting-leds for the NodeJS version this Python port is based on
