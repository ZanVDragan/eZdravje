$(document).ready(function () {
	var baseUrl = 'https://rest.ehrscape.com/rest/v1';

	var username = "ois.seminar";
	var password = "ois4fri";
	
	/**
	 * Helper functions.
	 * <------------ START ------------>
	*/
	
	// Enable Bootstrap tooltips.
	$('[data-toggle="tooltip"]').tooltip(); 
	
	/**
	 * Display given error message at bed.html.
	 * @param error message to be displayed.
	*/
	function displayBedError (error) {
		$("#response-message").css("display", "block");
		$("#response-message").html("<span class=\"message alert alert-danger fade in\">" +
									error +
								"</span>");
		// Wait 2 seconds and hide the message.
		setTimeout(function () {
			$("#response-message").removeAttr("style");
			$("#response-message").html("");
		}, 2000);
	}
	
	/**
	 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
	 * enolične ID številke za dostop do funkcionalnosti
	 * @return enolični identifikator seje za dostop do funkcionalnosti
	 */
	function getSessionId() {
		var response = $.ajax({
			type: "POST",
			url: baseUrl + "/session?username=" + encodeURIComponent(username) +
					"&password=" + encodeURIComponent(password),
			async: false
		});
		return response.responseJSON.sessionId;
	}
	
	/**
	 * Helper functions.
	 * <------------ END ------------>
	*/
	
	/**
	 * API related code.
	 * <------------ START ------------>
	*/

	
	/**
	 * Create new EHR.
	 * @param sessionId of current session.
	 * @param callback function to be executed.
	*/
	function createNewEHR(sessionId, callback) {
		// Build Ajax header.
		$.ajaxSetup({
			headers: {
				"Ehr-Session": sessionId
			}
		});
		
		// Build Ajax request for new EHR entry.
		$.ajax({
			url: baseUrl + "/ehr",
			type: "POST",
			success: function (responseEhr) {
				// Execute the callback function.
				callback(responseEhr.ehrId);
			},
			error: function (errorEhr) {
				// Notify user about error adding new EHR.
				displayBedError("Prišlo je do napake! <br>" + errorEhr.statusText);
			}
		});
	}
	
	
	/**
	 * Create new patient.
	 * @param patientData of the patient.
	 * @param callback function to be executed.
	*/
	function createNewPatient(patientData, callback) {
		// Build Ajax request for new patient.
		$.ajax({
			url: baseUrl + "/demographics/party",
			type: "POST",
			contentType: "application/json",
			data: JSON.stringify(patientData),
			success: function (responseDemographics) {
				// Execute the callback function.
				callback();
			},
			error: function (errorDemographics) {
				// Notify user about error adding new patient.
				displayBedError("Prišlo je do napake! <br>" + errorDemographics.statusText);
			}
		});
	}
	
	/**
	 * Post patient record.
	 * @param ehrId of the patient.
	 * @param recordData to be posted.
	 * @param recordData to be saved.
	*/
	function postPatientRecord(ehrId, recordData, callback) {
		// Parameters for Ajax request.
		var requestParam = {
			ehrId: ehrId,
			templateId: "Vital Signs",
			format: "FLAT",
			commiter: "sestra Franja"
		};
		// Build Ajax request for writing record data.
		$.ajax({
			url: baseUrl + "/composition?" + $.param(requestParam),
			type: "POST",
			contentType: "application/json",
			data: JSON.stringify(recordData),
			success: function (responseComposition) {
				// Notify user about success.
				$("#response-message").css("display", "block");
				$("#response-message").html("<span class=\"message alert alert-success fade in\">" +
												"Podatki uspešno shranjeni! " +
											"</span>");
				setTimeout(function () {
					$("#response-message").removeAttr("style");
					$("#response-message").html("");
					// Check if callback has been given and valid.
					if (callback && typeof callback == "function")
						callback();
				}, 2000);
			},
			error: function (errorComposition) {
				// Notify user about error saving record data.
				displayBedError("Prišlo je do napake! <br>" + errorComposition.statusText);
			}
		});
	}
	
	/**
	 * Retrieve patient's data.
	 * @param ehrId of the ptient.
	 * @param room boolean if in room or bed.
	 * @param callback to be executed.
	*/
	function getPatientData(ehrId, room, callback) {
		// Check if EHR ID has been provided.
		if (ehrId || ehrId.trim().length > 0) {
			// Build Ajax request for retrieving patient data.
			$.ajax({
				url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
				type: "GET",
				success: function (patientData) {
					// Check if in room or bed view.
					if (room) {
						callback(patientData);
					} else {
						$("#name").val(patientData.party.firstNames);
						$("#surname").val(patientData.party.lastNames);
					}
				},
				error: function (errorData) {
					// Notify user about error retrieving name and surname.
					displayBedError("Prišlo je do napake! <br>" + errorData.statusText);
				}
			});
		} else if (callback && typeof callback == "function")
			callback({"party": {
						"firstNames": "",
						"lastNames": ""
					}});
	}
	
	function getPatientRecord(ehrId, callback) {
		$.ajax({
			url: baseUrl + "/view/" + ehrId + "/height",
			type: "GET",
			success: function (responseHeight) {
				$("#height").val(responseHeight[0].height);
				$.ajax({
					url: baseUrl + "/view/" + ehrId + "/weight",
					type: "GET",
					success: function (responseWeight) {
						$("#weight").val(responseWeight[0].weight);
						$.ajax({
							url: baseUrl + "/view/" + ehrId + "/body_temperature",
							type: "GET",
							success: function (responseTemperature) {
								$("#temperature").val(responseTemperature[0].temperature);
								$.ajax({
									url: baseUrl + "/view/" + ehrId + "/spO2",
									type: "GET",
									success: function (responseSaturation) {
										$("#saturation").val(responseSaturation[0].spO2);
										$.ajax({
											url: baseUrl + "/view/" + ehrId + "/blood_pressure",
											type: "GET",
											success: function (responsePressure) {
												$("#systolic").val(responsePressure[0].systolic);
												$("#diastolic").val(responsePressure[0].diastolic);
												// Execute the callback function.
												callback();
											},
											error: function (errorPressure) {
												// Notify user about error retrieving blood pressure.
												displayBedError(errorPressure.statusText);
											}
										});
									},
									error: function (errorSaturation) {
										// Notify user about error retrieving saturation.
										displayBedError("Prišlo je do napake! <br>" + errorSaturation.statusText);
									}
								});
							},
							error: function (errorTemperature) {
								// Notify user about error retrieving temperature.
								displayBedError("Prišlo je do napake! <br>" + errorTemperature.statusText);
							}
						});
					},
					error: function (errorWeight) {
						// Notify user about error retrieving weight.
						displayBedError("Prišlo je do napake! <br>" + errorWeight.statusText);
					}
				});
			},
			error: function (errorHeight) {
				// Notify user about error retrieving height.
				displayBedError("Prišlo je do napake! <br>" + errorHeight.statusText);
			}
		});
	}
	
	/**
	 * API related code.
	 * <------------ END ------------>
	*/
	
	/**
	 * Front-end functions.
	 * <------------ START ------------>
	*/
	
	/**
	 * Build patient data.
	 * @param name
	 * @param surname
	 * @param ehrId
	 * @return patientData
	*/
	function buildPatientData(name, surname, ehrId, callback) {
		var patientData = {
			firstNames: name,
			lastNames: surname,
			partyAdditionalInfo: [{
				key: "ehrId",
				value: ehrId
			}]
		};
		// Execute the callback function.
		callback(patientData);
	}
	
	/**
	 * Build record data.
	 * @param height
	 * @param weight
	 * @param temperature
	 * @param saturation
	 * @param systolic
	 * @param diastolic
	 * @return recordData
	*/
	function buildRecordData(height, weight, temperature, saturation, systolic, diastolic, callback) {
		var recordData = {
				"ctx/language": "en",
				"ctx/territory": "SI",
				"vital_signs/height_length/any_event/body_height_length": height,
				"vital_signs/body_weight/any_event/body_weight": weight,
				"vital_signs/body_temperature/any_event/temperature|magnitude":  temperature,
				"vital_signs/body_temperature/any_event/temperature|unit": "°C",
				"vital_signs/indirect_oximetry:0/spo2|numerator": saturation,
				"vital_signs/blood_pressure/any_event/systolic": systolic,
				"vital_signs/blood_pressure/any_event/diastolic": diastolic
			};
		// Execute the callback function.
		callback(recordData);
	}
	
	/**
	 * Create new patient record or update it.
	*/
	$("#patient-record").submit(function (e) {
		e.preventDefault();
		
		// Retrieve data.
		var ehrId = $("#ehr-id").val();
		
		// Check if this is a new patient.
		if (!ehrId || ehrId.trim().length == 0) {
			// Create record data object.
			buildRecordData($("#height").val(), $("#weight").val(), $("#temperature").val(),
							$("#saturation").val(), $("#systolic").val(), $("#diastolic").val(),
							function (recordData) {
					// Create new EHR.
					createNewEHR(getSessionId(), function (ehrId) {
						// Create patient data object.
						buildPatientData($("#name").val(), $("#surname").val(), ehrId, function (patientData) {
							// Create new patient and store record.
							createNewPatient(patientData, function () {
								postPatientRecord(ehrId, recordData, function () {
									// Store new EHR ID to the assigned URL parameter.
									var urlValue = parseURLParams(window.location.href);
									// Check if there are parameters.
									if (urlValue != undefined) {
										var bedId = urlValue["bed"];
										// Store EHR ID to the selected bed.
										urlValue[bedId][0] = ehrId;
										var url = "bed.html?bed=" + bedId +
											"&1=" + urlValue[1][0] +
											"&2=" + urlValue[2][0] +
											"&3=" + urlValue[3][0] +
											"&4=" + urlValue[4][0] + "#";
										// Reload this site with new URL.
										window.open(url, "_self");
									} else {
										// Build URL.
										urlValue = {
											"bed": 1,
											"1": ehrId,
											"2": " ",
											"3": " ",
											"4": " "
										};
										// Reload this site with new URL.
										urlValue = "bed.html?bed=1&1=" + ehrId + "&2=&3=&4=#";
										window.open(urlValue, "_self");
									}
								});
							});
						});
					});
				});
		} else {
			// Update records.
			buildRecordData($("#height").val(), $("#weight").val(), $("#temperature").val(),
							$("#saturation").val(), $("#systolic").val(), $("#diastolic").val(),
							function (recordData) {
					postPatientRecord(ehrId, recordData, function () {
						// Store new EHR ID to the assigned URL parameter.
						var urlValue = parseURLParams(window.location.href);
						// Check if there are parameters.
						if (urlValue != undefined) {
							var bedId = urlValue["bed"];
							// Store EHR ID to the selected bed.
							urlValue[bedId][0] = ehrId;
							var url = "bed.html?bed=" + bedId +
								"&1=" + urlValue[1][0] +
								"&2=" + urlValue[2][0] +
								"&3=" + urlValue[3][0] +
								"&4=" + urlValue[4][0] + "#";
							// Reload this site with new URL.
							window.open(url, "_self");
						} else {
							// Build URL.
							urlValue = {
								"bed": 1,
								"1": ehrId,
								"2": " ",
								"3": " ",
								"4": " "
							};
							// Reload this site with new URL.
							urlValue = "bed.html?bed=1&1=" + ehrId + "&2=&3=&4=#";
							window.open(urlValue, "_self");
						}
					});
			});
		}
	});
	
	function drawGraph() {
		$(".chart").html("");
		var weight = $("#weight").val();
		var height = $("#height").val()/100;
		var bmi = +(Math.round(weight / (height * height) + "e+2")  + "e-2");
		var data = [
			{key: "bmi", text: "ITM", val: bmi},
			{key: "temperature", text: "Temperatura (°C)", val: $("#temperature").val()},
			{key: "saturation", text: "Nasičenost z O2 (%)", val: $("#saturation").val()},
			{key: "systolic", text: "Sistolični tlak (mmHg)", val: $("#systolic").val()},
			{key: "diastolic", text: "Diastolični tlak (mmHg)", val: $("#diastolic").val()}
		];

		d3.select(".chart")
			.selectAll("div")
				.data(data)
			.enter().append("div")
				.style("width", function(d) {
					// Check if there is no value.
					if (!d.val || d.val == NaN) {
						return "0px";
					} else {
						// Check key value.
						if (d.key == "bmi" || d.key == "temperature")
							return d.val * 10 + "px";
						else
							return d.val * 5 + "px";
					}
				})
				.style("background-color", function(d) {
					// Check if there is no value.
					if (!d.val || d.val == NaN) {
						return "white";
					} else {
						// Check key value.
						// Check corresponding value with boundaries.
						// Color bar accordingly.
						if (d.key == "bmi" && (d.val < 20 || d.val > 25) ||
						   d.key == "temperature" && (d.val < 36 || d.val >= 37) ||
						   d.key == "saturation" && d.val < 90 ||
						   d.key == "systolic" && d.val >= 120 ||
						   d.key == "diastolic" && d.val >= 80) {
							return "red"
						} else {
							return "green";
						}
					}
				})
				.text(function(d) {
					if (!d.val || d.val == NaN) {
						return "";
					} else {
						return d.text + " " + d.val;
					}
				})
				.attr("data-toggle", "tooltip")
				.attr("title", function (d) {
					// Check if there is no value.
					if (!d.val || d.val == NaN) {
						return "";
					} else {
						// Check key value and assign tooltip accordingly.
						if (d.key == "bmi")
							return "Indeks Telesne Mase 20 - 25";
						else if (d.key == "temperature")
							return "Temperatura 36 - 37";
						else if (d.key == "saturation")
							return "Nasičenost krvi s kisikom > 90";
						else if (d.key == "systolic")
							return "Sistolični krvni tlak < 120";
						else
							return "Diastolični krvni tlak < 80";
					}
				});
	}
	
	function makeBed(bedNum, ehrId, name, surname, callback) {
		var bed = $("#bed-" + bedNum);
		// Check if it should be freed up.
		if (ehrId == "" && $(bed).hasClass("occupied-bed")) {
			// Set it as free bed.
			$(bed).toggleClass("occupied-bed free-bed text-center");
			// Clear data.
			$(bed).find("#ehr-" + bedNum).attr("data-ehr", "");
			$(bed).find("label").html("").promise().done(function () {
				// Check if callback is a function.
				if (callback && typeof callback == "function") 
					callback();
			});
		} else if (ehrId) {
			// Check if occupance class should be toggled.
			if ($(bed).hasClass("free-bed")) {
				$(bed).toggleClass("occupied-bed free-bed text-center");
			}
			// Store data.
			$(bed).find("#ehr-" + bedNum).attr("data-ehr", ehrId);
			$(bed).find(".name").html(name);
			$(bed).find(".surname").html(surname).promise().done(function () {
				// Check if callback is a function.
				if (callback && typeof callback == "function") 
					callback();
			});
		} else if (callback && typeof callback == "function") { // Check if callback is a function.
			callback();
		}
	}
	
	/**
	 * Generate dummy patient data.
	*/
	$("#generate-data").click(function (e) {
		e.preventDefault();
		
		var sessionId = getSessionId();
		
		// Record data #1.
		buildRecordData(185, 75, 36.4, 95, 110, 70, function (recordData) {
			// EHR #1.
			createNewEHR(sessionId, function (ehrId) {
				// Patient data #1.
				buildPatientData("Zdravko", "Zelenko", ehrId, function (patientData) {
					// Patient #1.
					createNewPatient(patientData, function () {
						// Record #1.
						postPatientRecord(ehrId, recordData);
						// View #1.
						makeBed(1, ehrId, patientData.firstNames, patientData.lastNames, function () {
							// Record data #2.
							buildRecordData(170, 80, 36.4, 90, 115, 90, function (recordData) {
								// EHR #2.
								createNewEHR(sessionId, function (ehrId) {
									// Patient data #2.
									buildPatientData("Rudi", "Rumenko", ehrId, function (patientData) {
										// Patient #2.
										createNewPatient(patientData, function () {
											// Record #2.
											postPatientRecord(ehrId, recordData);
											// View #2.
											makeBed(2, ehrId, patientData.firstNames, patientData.lastNames, function () {
												// Record data #3.
												buildRecordData(168, 120, 37.7, 85, 180, 110, function (recordData) {
													// EHR #3.
													createNewEHR(sessionId, function (ehrId) {
														// Patient data #3.
														buildPatientData("Srečko", "Rdečko", ehrId, function (patientData) {
															// Patient #3.
															createNewPatient(patientData, function () {
																// Record #3.
																postPatientRecord(ehrId, recordData);
																// View #3.
																makeBed(3, ehrId, patientData.firstNames, patientData.lastNames);
															});
														});
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});
	
	/**
	 * Retrieve URL passed parameters (EHR ID's).
	 * Code found at:
	 * http://stackoverflow.com/questions/814613/how-to-read-get-data-from-a-url-using-javascript
	 * URL example:
	 *	"http://www.foo.com/bar?a=a+a&b%20b=b&c=1&c=2&d#hash"
	 * @param url to be processed.
	 * @return params array of parameters.
	*/
	function parseURLParams(url) {
		var queryStart = url.indexOf("?") + 1,
			queryEnd   = url.indexOf("#") + 1 || url.length + 1,
			query = url.slice(queryStart, queryEnd - 1),
			pairs = query.replace(/\+/g, " ").split("&"),
			params = {}, i, n, v, nv;

		if (query === url || query === "") {
			return;
		}

		for (i = 0; i < pairs.length; i++) {
			nv = pairs[i].split("=");
			n = decodeURIComponent(nv[0]);
			v = decodeURIComponent(nv[1]);

			if (!params.hasOwnProperty(n)) {
				params[n] = [];
			}

			params[n].push(nv.length === 2 ? v : null);
		}
		return params;
	}
	
	/**
	 * Build URL for showing bed.
	 * @param object of the caller function.
	 * @param callback to be executed.
	*/
	function buildBedURL(obj, callback) {
		
		// Check which bed has been selected.
		var bedNum = "1";
		if ($(obj).attr("data-bed") == "2")
			bedNum = "2";
		else if ($(obj).attr("data-bed") == "3")
			bedNum = "3";
		else if ($(obj).attr("data-bed") == "4")
			bedNum = "4";
		url = "bed.html?bed=" + bedNum +
			"&1=" + $("#ehr-1").attr("data-ehr") +
			"&2=" + $("#ehr-2").attr("data-ehr") +
			"&3=" + $("#ehr-3").attr("data-ehr") +
			"&4=" + $("#ehr-4").attr("data-ehr") + "#";
		callback(url);
	}
	
	/**
	 * Build URL for showing room.
	 * @param params with EHR ID's to be added to URL.
	 * @param callback function to be executed.
	*/
	function buildRoomURL(params, callback) {
		var url = "index.html?";
		// Check for params.
		if (params != undefined) {
			url += "1=" + params["1"][0].trim() +
				"&2=" + params["2"][0].trim() +
				"&3=" + params["3"][0].trim() +
				"&4=" + params["4"][0].trim() + "#";
		}
		callback(url);
	}
	
	/**
	 * Show user's data and record based on EHR ID.
	*/
	$("#search-ehr").click(function () {
		var ehrId = $("#ehr-id").val();
		if (ehrId != "") {
			// Create a session.
			var sessionId = getSessionId();
			// Build Ajax header.
			$.ajaxSetup({
				headers: {
					"Ehr-Session": sessionId
				}
			});
			// Fill in patient's first and last name.
			getPatientData(ehrId);
			// Fill in patient's record entries.
			getPatientRecord(ehrId, drawGraph);
		} else {
			alert("Prosimo, vnesite EHR ID za prikaz kartona!")
		}
	});
	
	// Retrieve URL parameters and values.
	var urlValue = parseURLParams(window.location.href);
	// Check if any URL parameters given.
	if (urlValue != undefined) {
		// Check if showing room or bed.
		if (window.location.href.indexOf("index") == -1) {
			// Get which bed is selected.
			var bedId = urlValue["bed"][0];
			// Set bed name.
			$("#bed-name").html("Postelja " + bedId);
			// Check if bed has been selected and not a new record.
			if (bedId > 0 && urlValue[bedId] != "") {
				// Get patient's EHR ID.
				var ehrId = urlValue[bedId][0];
				// Set EHR ID value.
				$("#ehr-id").val(ehrId);
				// Create a session.
				var sessionId = getSessionId();
				// Build Ajax header.
				$.ajaxSetup({
					headers: {
						"Ehr-Session": sessionId
					}
				});
				// Fill in patient's first and last name.
				getPatientData(ehrId, false);
				// Fill in patient's record entries.
				getPatientRecord(ehrId, drawGraph);
			}
		} else {
			// Create a session.
			var sessionId = getSessionId();
			// Build Ajax header.
			$.ajaxSetup({
				headers: {
					"Ehr-Session": sessionId
				}
			});
			// Fill in each patient's data.
			var ehrId = urlValue[1][0];
			getPatientData(ehrId, true, function(patientData) {
				makeBed(1, ehrId, patientData.party.firstNames, patientData.party.lastNames, function () {
					ehrId = urlValue[2][0];
					getPatientData(ehrId, true, function(patientData) {
						makeBed(2, ehrId, patientData.party.firstNames, patientData.party.lastNames, function () {
							ehrId = urlValue[3][0];
							getPatientData(ehrId, true, function(patientData) {
								makeBed(3, ehrId, patientData.party.firstNames, patientData.party.lastNames, function () {
									ehrId = urlValue[4][0];
									getPatientData(ehrId, true, function(patientData) {
										makeBed(4, ehrId, patientData.party.firstNames, patientData.party.lastNames);
									});
								});
							});
						});
					});
				});
			});
		}
	}
	
	
	/**
	 * Go back to the room view.
	*/
	$("#back").click(function () {
		buildRoomURL(urlValue, function (url) {
			window.open(url, "_self")
		});
	});
	
	/**
	 * Go back to the room view with removing the patient from the bed.
	*/
	$("#discharge-patient").click(function () {
		if (urlValue != undefined) {
			var bed = urlValue["bed"];
			urlValue[bed] = " ";
		}
		buildRoomURL(urlValue, function (url) {
			window.open(url, "_self");
		});
	});
	
	/**
	 * Show empty bed.
	*/
	$(".add-bed").click(function (e) {
		e.preventDefault();
		buildBedURL($(this), function (url) {
			// Go to the given URL.
			window.open(url, "_self");
		});
	});
	
	/**
	 * View patient's record.
	*/
	$(".check-patient").click(function () {
		buildBedURL($(this), function (url) {
			// Go to the given URL.
			window.open(url, "_self");
		});
	});
	
	/**
	 * Open farmaceutical site.
	 * Put in keywords depending on the patient's condition.
	*/
	$("#show-medication").click(function () {
		var searchURL = "http://www.lekarnar.com/izdelki?utf8=%E2%9C%93&keywords=";
		var validSearch = false;
		// Check body mass index.
		var height = $("#height").val();
		var weight = $("#weight").val();
		if (height && weight) {
			var bmi = weight / (height/100 * height/100);
			if (bmi < 20) {
				window.open(searchURL + "podhranjenost");
				validSearch = true;
			} else if (bmi > 25) {
				window.open(searchURL + "holesterol");
				validSearch = true;
			}
		}
		// Check temperature.
		var temperature = $("#temperature").val();
		if (temperature && (temperature < 36 || temperature >= 37)) {
			window.open(searchURL + "temperatura");
			validSearch = true;
		}
		// Check blood saturation.
		var saturation = $("#saturation").val();
		if (saturation && saturation < 90) {
			window.open(searchURL + "nasičenost+s+kisikom");
			validSearch = true;
		}
		// Check blood pressure.
		var systolic = $("#systolic").val();
		var diastolic = $("#diastolic").val();
		if (systolic && diastolic) {
			if (systolic >= 120 || diastolic >= 80) {
				window.open(searchURL + "krvni+tlak");
				validSearch = true;
			}
		}
		if (!validSearch)
			displayBedError("Stanje ne potrebuje zdravljenja.");
	});
	
	// Redraw graph on change of the input values.
	$("form :input").focusout(drawGraph);
	
	/**
	 * Front-end functions.
	 * <------------ END ------------>
	*/
	
});