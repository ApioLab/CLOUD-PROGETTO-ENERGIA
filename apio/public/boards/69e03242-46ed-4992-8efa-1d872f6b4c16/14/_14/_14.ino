
#include "Apio.h"
#include "property.h"
void setup() {
	Apio.setup("Temperature", "1,0", 3069, 0x01);
}

void loop(){
	Apio.loop();
	if(property=="temperature"){
		//Do Something
				property=="";
		
	}
	if(property=="humidity"){
		//Do Something
				property=="";
		
	}
	if(property=="humidex"){
		//Do Something
				property=="";
		
	}
}