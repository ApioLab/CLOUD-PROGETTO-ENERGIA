
#include "Apio.h"
#include "property.h"
void setup() {
	Apio.setup("PIR", "1,0", 60, 0x01);
}

void loop(){
	Apio.loop();
}