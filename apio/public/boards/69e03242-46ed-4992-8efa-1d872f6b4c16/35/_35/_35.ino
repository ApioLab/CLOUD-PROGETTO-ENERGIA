
#include "Apio.h"
#include "property.h"
int pin20=20;
void setup() {
	Apio.setup("Led", "1,0", 1, 0x01);
	pinMode(pin20,OUTPUT);
}

void loop(){
	Apio.loop();
	property.Trigger("onoff",pin20 ,1, 0 );
}