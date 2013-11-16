//Useful Websites
// http://math.stackexchange.com/questions/406082/numerical-method-to-solve-a-trigonometric-cotangent-function-transient-heat
// http://web.cecs.pdx.edu/~gerry/epub/pdf/transientConductionSphere.pdf
// http://web.cecs.pdx.edu/~gerry/epub/

//Global Variables for Turkey
density = 996; // kg/m3 Assuming Density of Water 1000 kg/m3
cp = 2810 // J/kg K for Turkey
heatConvection = 5; // W/m2 K Some Reasonable estimate for natural Convection. Change as needed. 5-25
thermalConduct = 0.412 // W/m K // Chicken
globalTime = 1;

function celsiusToFarenheit(celsius) {
farenheit = (celsius*(9/5)) + 32;
return(farenheit)
}

function farenheitToCelsius (farenheit) {
celsius = (farenheit*(9/5)) + 32;
return(celsius)
}

function poundsToKilograms(pounds) {
kilograms = (pounds * 0.453592);
return(kilograms)
}

function calculateRadius(weight) {
//Using Ratios for a rectangular Box Turkey
ratioLvG=1.4; //1.4, Turkey length vs shoulder girth
ratioLvH=2; //2, Turkey length vs height from resting position

length = Math.pow(weight/((1/ratioLvG)*(1/ratioLvH)*density),(1/3))
depth = 1/(ratioLvG /length);
height = 1/(ratioLvH /length);
simpleRadius = length/2; //Doesn't take into account equal Volume

rectangleVolume = depth*height*length*(1/3); //m^3  Multiple by 1/3 to account for triangular shape and empty Space
complexRadius = Math.pow(rectangleVolume/((4/3)*Math.PI), 1/3); //Volume of 3D Box = 3D Sphere

console.log("Simple Radius  " + simpleRadius + " Meters")
console.log("Complex Radius  " + complexRadius + " Meters")
return(complexRadius)
}


function findAllRoots(min,max,splitsNum,Biot) {
var step = ( max - min ) / ( splitsNum - 1 );
var storage = [];
	for (var i = step; i < max; i=i+step ) {
		negativeTest = lambdaFormula(i-step, Biot)*lambdaFormula(i, Biot);
		if (negativeTest <= 0) {
			answer = bisectionMethod(i-step,i,Biot);
			if (answer !=undefined) {
				storage.push(answer);
			}
		}
		else {
			//console.log("No Bracketed Root " + negativeTest)
		}
	}
return(storage)	
}
	  
function linspace(min, max, length) {
var arr = new Array(length);
var step = ( max - min ) / ( length - 1 );
for (var i = 0; i < length; ++i )
        arr[i] = min + ( i * step )
      return arr
}
	
function bisectionMethod(min,max,Biot) {
errorTolerance = (1/Math.pow(10,8))
result = Infinity // some large value to ensure the calculation goes through.
negativeTest =lambdaFormula(min, Biot)*lambdaFormula(max, Biot)
	if (negativeTest <=0 ) {
		var antiFreeze=0;
		while (Math.abs(result) > errorTolerance && antiFreeze<=500) { //The greater the antiFreeze, the more wasted cycles around a singularity	
			lambdaN = (min+max)/2
			result=lambdaFormula(lambdaN, Biot)
			if (Math.abs(result) <= errorTolerance && result<=errorTolerance) {
				return (lambdaN); //At Root
			}
			else if ((lambdaFormula(min, Biot)*lambdaFormula(lambdaN, Biot))>=0) {
				min=lambdaN;
			}
			else if ((lambdaFormula(max, Biot)*lambdaFormula(lambdaN, Biot))>=0) {
				max=lambdaN;
			}
			antiFreeze++
		}
	}
}

function lambdaFormula(lambdaN, Biot) { 
result = 1-lambdaN*(1/Math.tan(lambdaN))-Biot;
return(result)
}

function oven() {
this.tempInfini=20; //C
this.setTemp = 20;
var proportional = 0.1; // This value is arbitrary to how fast you want the temperatures to converge. (Or oscillate, which could be realistic as well)
var errorTolerance = 5; //Stove is accurate to 1 degree Celcius Should hopefully oscillate below that value.

	this.changeTemp = function(setTemp) {
		this.setTemp = setTemp;
	}

	this.equalizeTemp = function() { // Equalize Temp will need to be sent each time iteration
		var error = Math.abs(this.setTemp-this.tempInfini);
		if (this.setTemp>this.tempInfini) {
			this.tempInfini = this.tempInfini + error*proportional;
		}
		else if (this.setTemp<this.tempInfini) {
			this.tempInfini = this.tempInfini - error*proportional;
		}
		if (error>errorTolerance) {
			return (true) //Need to run the Heat Calculations again next cycle
		}
	}
}

function layerModel(name,radiusPercent) {
	this.name = name;
	this.radiusPercent=radiusPercent;
	this.initialTemp = 20;
	this.waterContent =100000;
	this.Qdot = 0;
	this.finalTemperature = 20;
}
 

function turkeyModel(weight) {

this.totalRadius = calculateRadius(weight)
this.skin = new layerModel("Skin",0.85)
this.body = new layerModel("Body",0.45)
this.core = new layerModel("Core",0.01)

	this.updateLayerTemps = function() {
		this.skin.finalTemperature = transientSphereSeries (this.skin.radiusPercent*this.totalRadius,this.totalRadius,this.skin.initialTemp,ovenObject.tempInfini,globalTime)
		this.skin.initialTemp = this.skin.finalTemperature;

		this.body.finalTemperature = transientSphereSeries (this.body.radiusPercent*this.totalRadius,this.totalRadius,this.body.initialTemp,ovenObject.tempInfini,globalTime)
		this.body.initialTemp = this.body.finalTemperature;

		this.core.finalTemperature = transientSphereSeries (this.core.radiusPercent*this.totalRadius,this.totalRadius,this.core.initialTemp,ovenObject.tempInfini,globalTime)
		this.core.initialTemp = this.core.finalTemperature;
	}
}

var oldBiot=null;
function transientSphereSeries (rPosition,rTotal,tempInitial,tempInfini,t) {
var min = 0;
var max = 1000; // This are for setting Lambda boundries and nothing else

var sum=0;
var alpha = thermalConduct/(density*cp)
//console.log("Alpha is " + alpha)

var Fourier = (alpha*t)/Math.pow(rTotal,2)
//console.log("Fourier is " +  Fourier)

var biotNum = heatConvection * rTotal/thermalConduct

	if (biotNum != oldBiot) {
		console.log("Recalculating Lambda Terms")
		lambdaTerms = findAllRoots(min,max,max*Math.PI*10,biotNum)
		oldBiot = biotNum;
	}

//console.log("The Biot Value is " + biotNum)

for (var i = 0; i<lambdaTerms.length; i++) {
	lambdaN = lambdaTerms[i]
	sinPortion= Math.sin(lambdaN*rPosition/rTotal)/(lambdaN*rPosition/rTotal);
	exponentialPortion = (1/Math.exp(Math.pow(lambdaN,2)*Fourier))
	frontCoefficientPortion = 4*(Math.sin(lambdaN)-(lambdaN*Math.cos(lambdaN)))/ (2*lambdaN-Math.sin(2*lambdaN))
	sum = frontCoefficientPortion*exponentialPortion*sinPortion + sum
}
tempAtTimeAndRadius=(sum*(tempInitial-tempInfini))+tempInfini

console.log("The Temperature at radius " + rPosition + " m and time " + t + " seconds is " + tempAtTimeAndRadius + " C or " + celsiusToFarenheit(tempAtTimeAndRadius) + " F");
return(tempAtTimeAndRadius)
}


//Running the Program Stuff

ovenObject = new oven ();
turkey = new turkeyModel(8);

setInterval(function(){time()},20);

function time() {
	console.clear()
	if (ovenObject.equalizeTemp() ) {
		globalTime = 0; //Reset the model's time calculation if there are major changes in the tolerance of the temperature
	}
		else {globalTime = globalTime +60 }
	console.log(ovenObject.tempInfini)
	turkey.updateLayerTemps();
}