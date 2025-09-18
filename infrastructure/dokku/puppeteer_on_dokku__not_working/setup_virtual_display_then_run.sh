#!/usr/bin/env sh

# Startup Xvfb
Xvfb -ac :0 -screen 0 1920x1080x24 > /dev/null 2>&1 &

# Wait for Xvfb to start
sleep 2

# Export some variables
export DISPLAY=:0
export DBUS_SESSION_BUS_ADDRESS=autolaunch:
# Set XAUTHORITY environment variable
export XAUTHORITY=/root/.Xauthority

# Run commands
cmd=$@
echo "Running '$cmd'!"
if $cmd; then
    # no op
    echo "Successfully ran '$cmd'"
else
    exit_code=$?
    echo "Failure running '$cmd', exited with $exit_code"
    exit $exit_code
fi