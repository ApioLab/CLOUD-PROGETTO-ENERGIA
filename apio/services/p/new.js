module.exports = function(logic){
	var lis = new logic.listenProperty();
    var i= 0;
	var loop= function () {
        lis.set('16','onoff',function(valore){
            if (valore === 1) {
                console.log("Energy manager onoff 1");
                logic.setProperty('15','luci',String(valore));
            } else if (valore === 0) {
                console.log("Energy manager onoff 2");
                logic.setProperty('15','luci',String(valore));
            }
        }); 
	}
	return loop;
};