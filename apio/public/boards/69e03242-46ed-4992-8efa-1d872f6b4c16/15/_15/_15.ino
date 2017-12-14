
#include "Apio.h"
#include "property.h"
void setup() {
	Apio.setup("EnOcean Switch", "1,0", 3, 0x01);
}

void loop(){
	Apio.loop();
}