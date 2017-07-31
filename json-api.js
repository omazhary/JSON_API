/*********************************************************************
 * This file contains the self-developed JSON-API for dealing with
 * JSON information within local storage. It is still incomplete,
 * but it serves multiple basic needs so far.
 ********************************************************************/

/**
 * Loads the selected "data_type" from the local storage facility.
 * @param {String} - data_type A string representing which data table should be loaded.
 * @returns {object} A JSON object containing the required data.
 */
function load_data(data_type) {
	var obj = JSON.parse(localStorage[data_type].toString());
	return obj;
}

/**
 * Performs a basic selection from the JSON source, where the field has to be equal to the value.
 * @param {Object|Array} source - The data source upon which the select is performed.
 * @param {String} field - The field used in the comparision process.
 * @param {String} value - The value that the field should contain.
 * @returns {Object|Array} A JSON object containing the results.
 */
function select_cond_eq(source, field, value) {
	var result = [];
	for (var i = 0; i < source.length; i++) {
		var temp = source[i][field];
		if (temp === value) {
			result.push(source[i]);
		}
	}
	return result;
}

/**
 * Performs a basic selection on the JSON source, where the values of the given field are within the following list.
 * @param {Object|Array} source - The data source upon which the select is performed.
 * @param {String} field - The field used in the comparison process.
 * @param {String|Array} values - An array containing the list of permissable values.
 * @returns {Object|Array} A JSON object containing the results.
 */
function select_cond_in(source, field, values) {
	var result = [];
	for (var i = 0; i < source.length; i++) {
		var temp = source[i][field];
    if (values.indexOf(temp) >= 0) {
			result.push(source[i]);
		}
	}
	return result;
}

/**
 * Performs a selection on the JSON source, where the given field evaluates its values against another JSON source, in a join-like manner.
 * @param {Object|Array} source1 - The first table pertaining to this query.
 * @param {String} field - The field in source1 upon which the equi-join should be performed in source1.
 * @param {Object|Array} source2 - The second table pertaining to this query.
 * @param {String} values_field - The field in source2 upon which the equi-join should be performed in source2.
 * @returns {Object|Array} A JSON object containing the results from the first table only (no merge occurs).
 */
function select_cond_in_join(source1, field, source2, values_field) {
	var temp = [];
	for (var i = 0; i < source2.length; i++) {
		temp.push(source2[i][values_field]);
	}
	return select_cond_in(source1, field, temp);
}

/**
 * Copies a certain object from a JSON source.
 * @param {Object|Array} source - The JSON source from which the object should be copied.
 * @param {String} object_identifier_field - The fieldname according to which the required object should be compared.
 * @param {String} object_identifier_value - The value of the field to be compared.
 * @returns {Object|Array} A copy of the required object.
 */
function copy_json_object(source, object_identifier_field, object_identifier_value) {
  var result = [];
  result = select_cond_eq(source, object_identifier_field, object_identifier_value);
  if (result == null || result.length != 1) {
    return false;
  }
  return result[0];
}

/**
 * Inserts a JSON object into a JSON destination/source.
 * @param {Object|Array} destination - The source/destination into which the JSON object will be inserted.
 * @param {Object|Array} json_object - The JSON object that will be inserted.
 * @param {String} local_storage_destination - The name of the table within the local storage facility.
 * @returns {Boolean} TRUE if the operation was successful, FALSE otherwise.
 */
function insert_json_object(destination, json_object, local_storage_destination) {
  var result = false;
  var reference = destination[local_storage_destination][0];
  var key_temp = '';
  // Need to make sure the incoming tuple is of the same type as the destination.
  if (reference.length != json_object.length) {
    return false;
  }
  for (var key1 in json_object) {
    for (var key2 in reference) {
      if (key1 === key2) {
        result = true;
        break;
      } else {
        result = false;
      }
      key_temp = key2;
    }
    if (!result) {
      return false;
    }
  }
  // Now, we can add it:
  destination[local_storage_destination].push(json_object);
  // And update the local storage object:
  localStorage[local_storage_destination] = JSON.stringify(destination);

  return true;
}

/**
 * Updates a JSON object using another JSON object with changed values.
 * @param {Object|Array} destination - The source/destination where the JSON object will be changed.
 * @param {String} identifier_field - The field that serves as a primary key.
 * @param {String} identifier_value - The key's value.
 * @param {String} local_storage_destination - The name of the table within the local storage facility.
 * @param {Object|Array} object - The JSON object that has the updated values.
 * @returns {Boolean} TRUE if the operation was successful, FALSE otherwise.
 */
function update_json_object(destination, identifier_field, identifier_value, local_storage_destination, object) {
  for (var i = 0; i < destination[local_storage_destination].length; i++) {
    if (destination[local_storage_destination][i][identifier_field] === identifier_value) {
      for (var attr in destination[local_storage_destination][i]) {
        destination[local_storage_destination][i][attr] = object[attr];
      }
      localStorage[local_storage_destination] = JSON.stringify(destination);
      return true;
    }
  }
  return false;
}

/**
 * Deletes a JSON object from its JSON source.
 * @param {Object|Array} source - The JSON source from which the object will be deleted.
 * @param {String} identifier_field - The field that serves as an identifier field (key).
 * @param {String} identifier_value - The value of the identifier field (key).
 * @param {String} local_storage_destination - A string containing the source's name in the browser's local storage (table name).
 * @returns {Boolean} TRUE if the operation was successful, FALSE otherwise.
 */
 function delete_json_object(destination, identifier_field, identifier_value, local_storage_destination) {
   var objectx = select_cond_eq(destination[local_storage_destination], identifier_field, identifier_value)[0];
   var index2 = destination[local_storage_destination].indexOf(objectx);
   if (index2 < 0) {
     return false;
   } else {
     if (destination[local_storage_destination][index2][identifier_field].indexOf('nw') >= 0) {
       // It's an object that's just been added recently, doesn't exist in the DB yet.
       var index = destination[local_storage_destination].indexOf(objectx);
       destination[local_storage_destination].splice(index, 1);
       localStorage[local_storage_destination] = JSON.stringify(destination);
       return true;
     } else {
       // This object needs to be synced with the DB afterwards.
       objectx[identifier_field] = 'rm-' + objectx[identifier_field];
       //update the object in the source.
       return update_json_object(load_data(local_storage_destination), identifier_field, identifier_value, local_storage_destination, objectx);
     }
   }
 }

/**
 * Fetches the latest identifier in a JSON source.
 * @param {Object|Array} source - The JSON source to be queried.
 * @param {String} identifier_field - The field that serves as an identifier field (key).
 * @returns {String} A string containing the latest identifier's value.
 */
function get_latest_identifier(source, identifier_field) {
  var result = -1;
  for (var i = 0; i < source.length; i++) {
    var new_id = parseFloat(source[i][identifier_field]);
    if (new_id > result) {
      result = new_id;
    }
  }
  return result.toString();
}
