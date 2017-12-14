
#include "Apio.h"
#include "property.h"
void setup() {
	Apio.setup("Energy Manager", "1,0", 3085, 0x01);
}

void loop(){
	Apio.loop();
}