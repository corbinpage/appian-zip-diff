(function () {
  if (!window.FileReader || !window.ArrayBuffer) {
    $("#error_block").removeClass("hidden").addClass("show");
    return;
  }

  var objectArray = [];
  var duplicateCounter = 0;
  var fileCounter = 0;
  var $result = $("#result");
  $("#file").on("change", function(evt) {
    $result.html(""); // remove current content
    $("#result_block").removeClass("hidden").addClass("show"); // be sure to show the results
    var files = evt.target.files;
    for (var i = 0, f; f = files[i]; i++) {
      if(f.name.slice(f.name.lastIndexOf("."))!==".zip") {fileCounter++; continue;} //Skip non-zipfiles
      var reader = new FileReader();
      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
          try {
            var zip = new JSZip(e.target.result); 
            var exportLog = zip.folder("META-INF").file("export.log");
            var exportText = exportLog.asText();
            objectArray = parseExportLog(exportText,theFile.name,objectArray);
            fileCounter++;
            if(fileCounter===files.length) {
              renderUI(objectArray);
            }
          } catch(e) {
            var $fileContent = $("<div>", {
              "class" : "alert alert-danger",
              text : "Error reading " + theFile.name + " : " + e.message
            });
          }
        }
      })(f);

      reader.readAsArrayBuffer(f);
    }

  });

function parseExportLog(exportText, filename, objectArray) {
  var lines = exportText.split('\n');
  var seenSuccess = false;

  for(var line = 0; line < lines.length; line++){
    if(!seenSuccess) { 
      seenSuccess = (lines[line].search("Success")===0);
      console.log("continue");
      continue;
      // Only start parsing objects that have been 'Success'-fully exported
    } else if(seenSuccess && lines[line].length<=1) {
      break;
      // End when the list of objects is done (at a blank line)
    }


    var exportLine = lines[line].split(' ');
    var objName = lines[line].slice(lines[line].indexOf('"')).replace(/"/g,'');
    var dupInfo = isDuplicateObject(exportLine, objectArray);
    
    var newObject = {
      type: exportLine[0],
      id: exportLine[1],
      uuid: exportLine[2],
      name: objName,
      filename: filename,
      duplicate: dupInfo[0],
      dupNum: dupInfo[1]
    };
    objectArray.push(newObject);

  }
  return objectArray;
}

function isDuplicateObject(exportLine, objectArray) {
  for (var i = 0, l = objectArray.length; i < l; i++) {
    if(exportLine[2]===objectArray[i].uuid){
      duplicateCounter++;
      objectArray[i].duplicate = true;
      objectArray[i].dupNum = duplicateCounter;

      return [true, duplicateCounter];
    }
  }
  return [false, null];
}



function renderUI(objectArray) {
  $result.append('<div class="col-sm-12">' +
                 '<table id="results-table" class="table table-hover table-bordered table-striped table-condensed tablesorter">' +
                 '<thead>' +
                 '<th>Package</th>' +
                 '<th>Object</th>' +
                 '<th>Type</th>' +
                 '<th>Duplicate</th>' +
                 '</thead>' +
                 '<tbody></tbody>' +
                 '</table>' +
                 '</div>');

  var $tableBody = $("#results-table tbody");
  objectArray.forEach( function (object) {
    $tableBody.append(
                      '<tr '+(object.duplicate ? 'class="danger"' : '')+'>' +
                      '<td>'+object.filename+'</td>' +
                      '<td>'+object.name+'</td>' +
                      '<td>'+object.type+'</td>' +
                      '<td>'+object.duplicate+'</td>' +
                      '</tr>');
  });
  $("#results-table").tablesorter(); 
}

})();