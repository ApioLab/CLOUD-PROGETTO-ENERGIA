
#include "Apio.h"
#include "property.h"
void setup() {
	Apio.setup("Indoor Air Quality", "1,0", 17, 0x01);
}

void loop(){
	Apio.loop();
	//Use the function for the read data from Sensor and save it in
	//VOCVal
 	if (lastValueVOC !=  String(VOCVal)) {
		lastValueVOC = String(VOCVal);
		if(exists(VOC, "VOC", String(VOCVal), 1)){
			apioSend("17:update:VOC:"+String(VOCVal)+"-");
		}
	}
	if(property=="VOC"){
		if(value=="/"){
			apioSend("17:update:VOC:"+String(VOCVal)+"-");
		} else if(!exists(VOC, property, value, 0)){
				insert(&VOC, property, value);
		}else{
			deleteItem(&VOC, property, value);
			}
		property="";
		
	}
	//Use the function for the read data from Sensor and save it in
	//C02Val
 	if (lastValueC02 !=  String(C02Val)) {
		lastValueC02 = String(C02Val);
		if(exists(C02, "C02", String(C02Val), 1)){
			apioSend("17:update:C02:"+String(C02Val)+"-");
		}
	}
	if(property=="C02"){
		if(value=="/"){
			apioSend("17:update:C02:"+String(C02Val)+"-");
		} else if(!exists(C02, property, value, 0)){
				insert(&C02, property, value);
		}else{
			deleteItem(&C02, property, value);
			}
		property="";
		
	}
	//Use the function for the read data from Sensor and save it in
	//temperatureVal
 	if (lastValuetemperature !=  String(temperatureVal)) {
		lastValuetemperature = String(temperatureVal);
		if(exists(temperature, "temperature", String(temperatureVal), 1)){
			apioSend("17:update:temperature:"+String(temperatureVal)+"-");
		}
	}
	if(property=="temperature"){
		if(value=="/"){
			apioSend("17:update:temperature:"+String(temperatureVal)+"-");
		} else if(!exists(temperature, property, value, 0)){
				insert(&temperature, property, value);
		}else{
			deleteItem(&temperature, property, value);
			}
		property="";
		
	}
	//Use the function for the read data from Sensor and save it in
	//humidityVal
 	if (lastValuehumidity !=  String(humidityVal)) {
		lastValuehumidity = String(humidityVal);
		if(exists(humidity, "humidity", String(humidityVal), 1)){
			apioSend("17:update:humidity:"+String(humidityVal)+"-");
		}
	}
	if(property=="humidity"){
		if(value=="/"){
			apioSend("17:update:humidity:"+String(humidityVal)+"-");
		} else if(!exists(humidity, property, value, 0)){
				insert(&humidity, property, value);
		}else{
			deleteItem(&humidity, property, value);
			}
		property="";
		
	}
	//Use the function for the read data from Sensor and save it in
	//luminositaVal
 	if (lastValueluminosita !=  String(luminositaVal)) {
		lastValueluminosita = String(luminositaVal);
		if(exists(luminosita, "luminosita", String(luminositaVal), 1)){
			apioSend("17:update:luminosita:"+String(luminositaVal)+"-");
		}
	}
	if(property=="luminosita"){
		if(value=="/"){
			apioSend("17:update:luminosita:"+String(luminositaVal)+"-");
		} else if(!exists(luminosita, property, value, 0)){
				insert(&luminosita, property, value);
		}else{
			deleteItem(&luminosita, property, value);
			}
		property="";
		
	}
}