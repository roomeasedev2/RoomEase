/**
 * re.newController is a module that contains much of the UI-driven logic of the application.
 * Contains functions that are tied to various buttons and interactive elements that drive
 * events such as adding or updating database items. This modules serves as a wrapper and
 * middle man of the request handler calls, so that error handling and results from the DB
 * can be properly transferred to the front end.
 * @return {Object} the re.newController object, which has a public API containing functions
 *     for various buttons and interactive elements within the application. 
 */
re.newController = (function() {

    // TODO: Refactor these into a different module (localstorage)
	//var list_items = {};
	var fridgeItems = [];
	var reservationItems = [];
	var choresItems = [];
    var userIdsToNames = {};
    var userId = window.localStorage.getItem('user_id');
    var groupId = window.localStorage.getItem("group_id");
    
    /**
     * Initializes the controller module and the other modules that it uses
     * (login handler, request handler).
     */
	function init() {
        //Initialize login handler and requestHandler
        re.loginHandler.init("http://50.181.254.171:5985/");
		if (!userId){
			console.log("we couldn't find a UID! need to do FB Login");
            window.location.hash = "#fb";
		} else if (!groupId){
			console.log("we couldn't find a groupID! Need to do Group login!");
            window.location.hash = "#gl";
		} else {
			console.log("we found both a uid and a group id");
            re.requestHandler.init("http://50.181.254.171:5985/", userId, groupId);
            var onGetGroupIDs = function(isSucces, map, error){
                if(isSucces) {
                    user_ids_to_names = map;
                    console.log("Map set!");
                    console.log("Map");
                    console.log(map);
                } else {
                    console.log(error);
                }
            }

            re.requestHandler.getUidToNameMap(groupId, onGetGroupIDs);
            console.log("re.newController init finished!");
		}
	}
    
    
/****************************** "PRIVATE" ****************************************/
    
    /**  
     *
     */
    function displayError(error) {
        console.log(error);
        // let user know an error occurred and prompt them to try again
        Materialize.toast('Sorry! Something went wrong. Please try again', re.render.TOAST_TIMEOUT);
    }
    
/****************************** PUBLIC *********************************/ 
    
    /**
     * Returns the module's map of user IDs to String names
     */
    function getUIDsMap(){
        return user_ids_to_names;
    }
    
    /** 
     * Brings user back to whatever main module screen they're on
     */
    function hidePopup() {
        // clears the fields in popup & closes it
        $('.fixed-action-btn').css('display', 'block');
        $('#new-list-btn').css('display', 'block');
        $('#new-reservation-btn').css('display', 'block');
        $('#new-fridge-item-btn').css('display', 'block');
        $('.popupBackground').css('display', 'none');
    }
    
    /** 
     * Callback function for database.addItem
     * @param: is_success: True if the callback was successful, false otherwise
     *         revised_item: The revised item returned by the database. Null if failed.
     *         error: Describes error if error occured
     */
    function rhAddCallback(is_success, revised_item, error) {
        if (is_success) {
            console.log("success");
            // TODO: Add item to local storage here, then prompt a soft refresh
            // of page (pass parameter through route, perhaps?)
            re.render.route();
            // TODO: scroll to where the new list is
        } else {
            displayError(error);            
        }
    }
    
    /** 
     * Callback function for database.deleteItem
     * @param: is_success: True if the callback was successful, false otherwise
     *         error: Describes error if error occured
     */
    function rhDelCallback(is_success, error) {
        rhAddCallback(is_success, null, error);
    }
    
    /** 
     * Callback function for database.updateItem
     * @param: is_success: True if the callback was successful, false otherwise
     *         error: Describes error if error occured
	 *         was_deleted: True if the item was not updated for it was not located in the DB (Most likely due ot deletion)
	 *         updated_item: The item with the updated parameters
     */
    function rhUpdateCallback(is_success, was_deleted, updated_item, error) {
        if (is_success) {
            console.log("success");
            re.listController.listItems[updated_item._id] = updated_item;
            re.render.route();
            // TODO: scroll to where the new list is
        } else {
            displayError(error);
        }  
    }
    
        
    /**
     * Routes the user to create group view
     */
    function goToMakeView() {
        window.location.hash = "#gm";
    }
    
    /**
     * Routes the user to join group view
     */
    function goToJoinView() {
        console.log("called go to join view!");
        window.location.hash = "#gj"; 
    }
    
    /**
     * Attaches an xpull listener to an element of the given ID.
     * The xpull listener will call re.render.route(), triggering a full
     * refresh of the current page.
     * @param {string} elementId    The ID of the element to which we are attaching the listener
     */
    function assignXPull(elementId) {
        $('#' + elementId).xpull({
            'paused': false,  // Is the pulling paused ?
            'pullThreshold':200, // Pull threshold (in px)
            'callback':function(){
                re.render.route();
            }
        });
    }
    
    // Return the public API of the controller module,
    // making the following functions public to other modules.
	return {
		'init': init,
        //'list_items': list_items,
        'reservationItems': reservationItems,
        'getUIDsMap': getUIDsMap,
        'hidePopup': hidePopup,
        'rhAddCallback': rhAddCallback,
        'rhDelCallback': rhDelCallback,
        'rhUpdateCallback': rhUpdateCallback,
        'goToMakeView': goToMakeView,
        'goToJoinView': goToJoinView,
        'displayError': displayError,
        'assignXPull': assignXPull
	}
})();