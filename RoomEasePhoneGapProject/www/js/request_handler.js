"use strict";
/**
*TODO: Make a high level description of what this does
**/
re.requestHandler = (function(){
	var database_location = null;
	var user_id = null;
	var group_id = null;
	var databases = {};
	
	var type_to_table = {
		"chore":'chores',
		"fridge_item": 'fridge_items',
		"group":'groups',
		"list":'lists',
		"reservation":'reservations',
		"user":'users'
	};

	/**
	*initializes the reuired fields of the request handler. The db_location MUST be
	*the location of a DB of type CouchDB
	*datbase_location: The ip/host and port combination of the location of the database
	*usr_id: The Facebook id of the client
	*group_id: The group id of the client
	**/
	function init(db_location, u_id, grp_id) {
		database_location = db_location;
		user_id = u_id;
		group_id = grp_id;

		for (var key in type_to_table) {
			databases[type_to_table[key]] = 
			new PouchDB(database_location + type_to_table[key]);
		}
		return true;
	}


	/**
	*Adds an item of type item to the database. Calls callback on error or on success.
	*NOTE: An item CANNOT have an _id or _rev associated when it is added. The item retuened in 
	*the callback will have these fields added in. 
	*	item: The item to be added.
	*	callback(is_success, item_id, error)	
	*		is_success: True if the item was properly added to the database, false otherwise.
	*		revised_item: An item identical to the item passed as input, but with identifiers added
	*		error: null if item was added successfully. String describing error if error occured.
	**/
	function addItem(item, callback) {
		if(item == null || item.type == null){
			throw "Error: item or item_type are null";
		} else if (type_to_table[item.type] == null) {
			throw "Invalid item type";
		}
		
		group_id;

		databases[type_to_table[item.type]].post(item)
		.then(function(response){
			if (response.ok) {
				console.log(response);
				databases["groups"].get(group_id)
				.then(function(grp_response) {
					//TODO: check error type
					console.log(grp_response);
					grp_response[item.type].push(response.id);
					return grp_response;
				})
				.then(function(grp_response){
					console.log(grp_response);
					databases["groups"].post(grp_response);
				}).then(function(){
					var returnItem = item;
					returnItem["_id"] = response.id;
					returnItem["_rev"] = response.rev;
					callback(true, returnItem, null);
				});
			}


		}).catch(function(err) {
			callback(false, null, null);
			console.log(err);
		});


		return null;
	}

	/**
	* Returns all items of the given type that are assocated with a particular group. Calls callback on error or on success.
	*	type: The type of item that will be fetched from the database
	*	callback(list_of_items, error)
	*		list_of_items: a list containing every item of the given type associated with the group
	*		error: null of item was added successfully. String describing error if error occured.
	**/
	function getAllItemsOfType(type, callback) {
		if (user_id == null || group_id == null) {
			callback(null, "Error: no valid user_id and/or group_id assigned to user object");
			return;
		}


		var response_array = [];

		databases["groups"].get(group_id)
		.then(function(response){
			if (response[type] === null ) {
				//TODO: MAke sure this actually fails properly
				throw "Error: Type of item not found in the database";
			} else {

				var ids = [];
		 		for (var i = 0; i < response[type].length; i++) {
		 			ids.push(response[type][i]);
		 		}

		 		databases[type_to_table[type]].allDocs({
		 			include_docs: true,
		 			attachments: true,
		 			keys: ids 
		 		}).then(function(result){
		 			for (var i = 0; i < result.rows.length; i++){
		 				response_array.push(result.rows[i].doc);
		 			}
		 			callback(response_array, null);
		 		})
			}
		})
		.catch(function(err){
			callback(null, err);
		});
	}

	/**
	*Updates the item in the database to the new version of the item. Calls callack on success or on error.
	*	item: The item to be updated 
	*	callback(is_success, error):
	*		is_success: True if update was successful, false otherwise.
	*		error: null if item was updated successfully. String describing the error if error occured.
	**/	
	function updateItem(item, callback){
		//TODO: Implement
		callback(false, "Unimplemented");
		return null;
	}

	/**
	*Deletes the record of the item in the database. Calls callback on success or on error.
	*	item: The item to be deleted
	*	callback(is_success, error)
	*		is_success: True if item was deleted successfully. String describing error if error occured.
	**/
	function deleteItem(item, callback) {


		databases["groups"].get(group_id)
		.then(function (result){

			if (result[item.type] == null) {
				throw "Error";
			}
			
			if (!contains_id(result[item.type], item._id)){
				console.log("Foo");
				callback(true, null);//In the case where an intem has already been deleted, just say it succeeded
				return;
			}
			var index = result[item.type].indexOf(item._id);
			var removed_item_id = result[item.type].splice(index, 1);
			databases["groups"].post(result);
		
		}).then(function(result){

			databases[type_to_table[item.type]].get(item._id)
			.then(function(get_result){
				databases[type_to_table[item.type]].remove(get_result);
				callback(true, null);
			});

		})
		.catch(function(err){
			callback(false, err);
		});
	}

	/**
	*Returns true if a list contains the given id, false otherwise
	*	list: The list the potentially contains id
	*	id: The l
	*/	
	function contains_id(list, id) {
		console.log(id);
		for (var i = 0; i < list.length; i++) {
			if (list[i] === id) {
				return true;
			} 
		}
		return false;
	}

	return {
		'addItem': addItem,
		'getAllItemsOfType': getAllItemsOfType,
		'deleteItem': deleteItem,
		'init': init,
		'u_id': user_id,
		'grp_id': group_id
	}
})();