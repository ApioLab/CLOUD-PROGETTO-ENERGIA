#!/bin/bash
#cd /home/azureuser/apio
cd /home/azureuser/Apio-VIP-3
forever start -s -c "xvfb-run node --expose_gc" app.js
