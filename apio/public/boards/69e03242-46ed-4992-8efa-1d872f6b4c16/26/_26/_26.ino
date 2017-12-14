#include <XBee.h>
#include <ApioXbee.h>
void setup() {
	Serial.begin(9600);
}

void loop(){
	apioLoop();
}