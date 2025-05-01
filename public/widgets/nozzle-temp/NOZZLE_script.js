// BambuBoard
// TZ | Updated 2024

//-------------------------------------------------------------------------------------------------------------
const protocol = window.location.protocol; // 'http:' or 'https:'
const serverURL = window.location.hostname; // IP of the computer running this dashboard
const serverPort = window.location.port;
//-------------------------------------------------------------------------------------------------------------

let currentState = "OFF";
let modelImage = "";
const consoleLogging = false;
let settings = "";
let telemetryObjectMain;
const fullServerURL = `${protocol}//${serverURL}:${serverPort}`;

async function loadSettings() {
  try {
    const response = await fetch(fullServerURL + "/settings");
    if (response.ok) {
      const data = await response.json();
      settings = data;
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

loadSettings();

async function retrieveData() {
  const response = await fetch(fullServerURL + "/data.json");
  let data = await response.text();
  let telemetryObject = JSON.parse(data);

  if (telemetryObject.print && "gcode_state" in telemetryObject.print) {
    currentState = telemetryObject.print.gcode_state;
    telemetryObject = telemetryObject.print;
  } else if (telemetryObject.print) {
    telemetryObject = "Incomplete";
  } else {
    telemetryObject = null;
  }

  return telemetryObject;
}

async function updateUI(telemetryObject) {
  try {
    let printStatus = telemetryObject.gcode_state;

    let modelName = telemetryObject.gcode_file;
    modelName = modelName.replace("/data/Metadata/", "");

    $("#printModelName").text(telemetryObject.subtask_name);
    $("#printCurrentLayer").text(
      telemetryObject.layer_num + " of " + telemetryObject.total_layer_num
    );

    if (printStatus === "RUNNING") {
      printStatus = "Printing";
    } else if (printStatus === "FINISH") {
      printStatus = "Print Complete";
    } else if (printStatus === "FAILED") {
      // Handle failed case if needed
    }

    /// Nozzle Temp
    let nozzleTargetTempF = 0;
    let nozzleTargetTempC = telemetryObject.nozzle_target_temper;
    let nozzleTempPercentage = 1;

    // Set current temp in UI

    // Is nozzle 1 active?
    if(telemetryObject.device.extruder.info[0].stat != 0)
    {
        $("#activeTag").show();

        var nozzleCurrentTempF = Math.round((telemetryObject.nozzle_temper * 9) / 5 + 32);
        $("#nozzleCurrentTempF").text(nozzleCurrentTempF);

        var nozzleCurrentTempC = telemetryObject.nozzle_temper;
        if (nozzleCurrentTempC > 3) {
          $("#nozzleCurrentTempC").text(nozzleCurrentTempC);
          $("#nozzleCurrentTempC").show();
          $("#nozzleCurrentTempF").show();
        } else {
          $("#nozzleCurrentTemp").hide();
        }

        log("nozzleCurrentTempF = " + nozzleCurrentTempF);
        nozzleTempPercentage = (telemetryObject.nozzle_temper / nozzleTargetTempC) * 100;
        let progressNozzleParentWidth = $("#nozzleProgressBarParent").width();
        log("progressNozzleParentWidth = " + progressNozzleParentWidth);

        if (nozzleTempPercentage > 100) {
          log("Nozzle percentage over 100, adjusting..." + nozzleTempPercentage);
          nozzleTempPercentage = 100;
        }
    
        $("#nozzleProgressBar").width((nozzleTempPercentage * progressNozzleParentWidth) / 100);

        nozzleTargetTemp = Math.round((nozzleTargetTempC * 9) / 5 + 32);
        
    }
    else
    {
      nozzleTargetTemp = "OFF";
      nozzleTempPercentage = 0;
      disableUI();
    }    
    
    if (nozzleTargetTemp === "OFF") {
      $("#nozzleTargetTempF").text("OFF");
      $("#nozzleTargetTempC").text("OFF");
    } else {
      $("#nozzleTargetTempC").text(Math.round(nozzleTargetTempC));    
      $("#nozzleTargetTempF").text(nozzleTargetTemp);
    }

    log("nozzleTargetTemp = " + nozzleTargetTemp);
    log("nozzleTempPercentage = " + nozzleTempPercentage);

    if (nozzleTargetTemp === "OFF") {
      $("#nozzleProgressBar").css("background-color", "grey");

      $("#nozzleTargetTempSymbolsF").hide();
      $("#nozzleTargetTempSymbolsC").hide();
    } else {
      if (settings.BambuBoard_tempSetting === "Fahrenheit") {
        $("#nozzleTargetTempSymbolsF").show();
        $("#nozzleCurrentTempSymbolsF").show();
        $("#nozzleTargetTempF").show();
        $("#nozzleCurrentTempF").show();

        $("#nozzleCurrentTempC").hide();
        $("#nozzleTargetTempSymbolsC").hide();
        $("#nozzleCurrentTempSymbolsC").hide();
        $("#nozzleTargetTempC").hide();
      } else if (settings.BambuBoard_tempSetting === "Celsius") {
        $("#nozzleTargetTempSymbolsF").hide();
        $("#nozzleCurrentTempSymbolsF").hide();
        $("#nozzleTargetTempF").hide();
        $("#nozzleCurrentTempF").hide();

        $("#nozzleCurrentTempC").show();
        $("#nozzleTargetTempSymbolsC").show();
        $("#nozzleCurrentTempSymbolsC").show();
        $("#nozzleTargetTempC").show();
      } else if (settings.BambuBoard_tempSetting === "Both") {
        $("#nozzleTargetTempSymbolsF").show();
        $("#nozzleCurrentTempSymbolsF").show();
        $("#nozzleTargetTempF").show();
        $("#nozzleCurrentTempF").show();

        $("#nozzleCurrentTempC").show();
        $("#nozzleTargetTempSymbolsC").show();
        $("#nozzleCurrentTempSymbolsC").show();
        $("#nozzleTargetTempC").show();
      }

      if (nozzleTempPercentage > 80) {
        $("#nozzleProgressBar").css("background-color", "red");
      } else if (nozzleTempPercentage > 50) {
        $("#nozzleProgressBar").css("background-color", "yellow");
      } else {
        $("#nozzleProgressBar").css("background-color", "#51a34f");
      }
    }

    log(telemetryObject.t_utc);
    return telemetryObject;
  } catch (error) {
    console.error("Error: ", error);
  }
}

function disableUI() {
  $("#activeTag").hide();
  $("#nozzleProgressBar").css("background-color", "grey");
  $("#nozzleProgressBar").width(0);
  $("#nozzleTargetTempSymbolsF").hide();
  $("#nozzleTargetTempSymbolsC").hide();
  $("#nozzleTargetTempC").hide();
  $("#nozzleCurrentTempC").hide();
  $("#nozzleCurrentTempF").hide();
  $("#nozzleCurrentTempSymbolsC").hide();
  $("#nozzleCurrentTempSymbolsF").hide();
  $("#nozzleCurrentTemp").hide();
}


function log(logText) {
  if (consoleLogging) {
    console.log(logText);
  }
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

// Call the updateLog function to fetch and parse the data
setInterval(async () => {
  try {
    var telemetryObject = await retrieveData();
    telemetryObjectMain = telemetryObject;
    if (telemetryObject != null) {
      if (telemetryObject != "Incomplete") {
        await updateUI(telemetryObject);
      }
    } else if (telemetryObject != "Incomplete") {
      // Data is incomplete, but we did get something, just skip for now
    } else {
      disableUI();
    }
  } catch (error) {
    await sleep(1000);
  }
}, 1000);