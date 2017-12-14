#include "Apio.h"
#include "property.h"
void setup() {
	Apio.setup("Energy Meter", "1,0", 9, 0x01);
}

void loop(){
	Apio.loop();
}