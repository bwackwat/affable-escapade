
var urlParams;
window.onpopstate = function () {
	var match;
	var pl = /\+/g;  // Regex for replacing addition symbol with a space
	var search = /([^&=]+)=?([^&]*)/g;
	var decode = function (s) {
		return decodeURIComponent(s.replace(pl, " "));
	};
	var query  = window.location.search.substring(1);

	urlParams = {};
	while (match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);
}();

var status;
var state = {};
var sub_scripts = [];
var flashed = false;

var localStorageUsernameKey = "JPH2_USERNAME_KEY";
var localStorageTokenKey = "JPH2_TOKEN_KEY";
var localStorageFlashKey = "JPH2_FLASH_KEY";
var localStorageSessionKey = "libjaypea-session";

var apiUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/api";
function callAPI(method, route, data, callback){
	var sendData = JSON.stringify(data);
	//console.log("CALL " + method + " " + route);
	
	for (var key in data) {
		if (data.hasOwnProperty(key)){
			if(data[key] === "undefined" ||
			data[key] === null){
				console.log("Parameter is null or undefined: " + key + ". Does it matter?");
			}
		}
	}
	
	var http = new XMLHttpRequest();
	http.open(method, apiUrl + route, true);
	http.setRequestHeader("Content-Type", "application/json");
	if(localStorage.getItem(localStorageSessionKey) !== null){
		http.setRequestHeader(localStorageSessionKey, localStorage.getItem(localStorageSessionKey));
	}
	http.onreadystatechange = function(){
		//console.log("RECV: " + http.responseText);
		if(http.readyState == 4){
			if(http.status == 200){
				localStorage.setItem(localStorageSessionKey, http.getResponseHeader(localStorageSessionKey));
				try{
					callback(JSON.parse(http.responseText));
				}catch(e){
					callback(http.responseText);
				}
			}else{
				callback({"error":"Bad response from server..."});
			}
		}else if(http.readyState == 3){
			//Bogus OPTIONS response...
			
			//0: request not initialized
			//1: server connection established
			//2: request received
			//3: processing request
			//4: request finished and response is ready
		}else if(http.readyState === 2){
			// Headers received...

			// callback({"error":"Could not receive data."})
		}else if(http.readyState == 1){
			callback({"error":"Could not establish connection."})
		}else if(http.readyState == 0){
			callback({"error":"Did not start connection."})
		}else{
			//Invalid API usage...
			alert("HTTP ERROR!");
		}
	};
	//console.log("SEND: " + sendData);
	http.send(sendData);
}

function redirect_flash(url, flash){
	localStorage.setItem(localStorageFlashKey, flash);
	window.location.href = url;
}

function status(html){
	var status_element = document.getElementById("status");
	status_element.innerHTML = html;
	status_element.style.display = "block";
}

window.onload = function() {
	var status_element = document.getElementById("status");

	if(status_element !== null && status_element !== "undefined"){
		if(localStorage.getItem(localStorageFlashKey) !== null &&
		localStorage.getItem(localStorageFlashKey) !== "undefined"){
			status(localStorage.getItem(localStorageFlashKey));
			localStorage.removeItem(localStorageFlashKey);
			flashed = true;
		}

		if(status_element.innerHTML !== "{{{status}}}" && status_element.innerHTML !== ""){
			status_element.style.display = "block";
		}
	}

	for(var i = sub_scripts.length - 1; i >= 0; i--){
		sub_scripts[i](status_element);
	}
}

var adjectives = ["Good", "Other", "More", "New", "Many", "First", "Great", "Such", "Own", "Few", "Same", "High", "Last", "Most", "Different", "Small", "Large", "Important", "Next", "Big", "Little", "Old", "Social", "Able", "Available", "Online", "Free", "Long", "Easy", "Local", "Much", "Several", "Full", "Real", "Sure", "Public", "Possible", "Least", "Bad", "Personal", "Low", "Late", "Young", "Hard", "Current", "Only", "Right", "Second", "Early", "Special", "Simple", "Major", "Human", "Short", "Strong", "True", "Open", "Whole", "Less", "Financial", "Common", "Due", "Top", "Past", "Various", "Certain", "Recent", "Single", "Political", "Clear", "Specific", "Main", "Particular", "Happy", "Similar", "Natural", "Interesting", "National", "Private", "International", "Difficult", "Effective", "Unique", "Professional", "Perfect", "Economic", "Additional", "Key", "Mobile", "Original", "Nice", "Medical", "Third", "Entire", "Likely", "Necessary", "Global", "General", "Popular", "Successful", "Beautiful", "Wrong", "Significant", "Legal", "Enough", "Final", "Healthy", "White", "Ready", "Huge", "Interested", "Wide", "Former", "Safe", "Close", "Traditional", "Amazing", "Future", "Individual", "Physical", "Basic", "Complete", "Positive", "Black", "Federal", "Digital", "Deep", "Potential", "Useful", "Regular", "Hot", "Further", "Previous", "Serious", "Multiple", "Extra", "Excellent", "Poor", "Responsible", "Wonderful", "Quick", "Modern", "Daily", "Active", "Critical", "Favorite", "Annual", "Powerful", "Total", "Creative", "Appropriate", "Green", "Worth", "Normal", "Actual", "Fresh", "Fine", "Direct", "Present", "Cheap", "Military", "Rich", "Primary", "Relevant", "Essential", "Environmental", "Aware", "Fast", "Cool", "Corporate", "Red", "Technical", "Overall", "Light", "Live", "Independent", "Commercial", "Complex", "Average", "Cultural", "Dark", "Sexual", "Foreign", "Standard", "Educational", "Awesome", "Expensive", "Numerous", "Clean", "Proper", "Cold", "Academic", "Heavy", "Mental", "Initial", "Central", "Video", "Negative", "Exciting"];

var nouns = ["Time", "Year", "People", "Way", "Day", "Thing", "Information", "Work", "Business", "Service", "Life", "Company", "Site", "World", "Part", "System", "Student", "Child", "Program", "Number", "Place", "Lot", "Week", "Something", "Family", "Page", "Home", "Book", "Case", "Group", "Problem", "Product", "School", "Community", "Area", "Member", "Website", "Experience", "Issue", "Project", "State", "User", "Month", "Question", "Woman", "Point", "Game", "Course", "Country", "Government", "Idea", "Event", "Process", "Name", "Use", "Result", "Man", "Example", "Money", "Datum", "Change", "Today", "Research", "Job", "Customer", "Post", "Team", "Right", "Level", "Friend", "Blog", "Order", "Person", "Fact", "Term", "Health", "Content", "Law", "Type", "Market", "Other", "End", "Word", "Policy", "Development", "Value", "University", "Food", "Medium", "Article", "Power", "Hour", "Support", "Line", "Technology", "Need", "List", "Search", "Opportunity", "Cost", "Water", "Link", "Form", "Reason", "Study", "Application", "Report", "Tool", "Hand", "Activity", "Design", "Interest", "Plan", "Action", "History", "Industry", "Organization", "Bit", "Option", "Client", "Story", "Someone", "Class", "Price", "Side", "Kind", "Rate", "Source", "Quality", "Web", "Education", "Practice", "Comment", "City", "Care", "Car", "Party", "File", "Image", "Marketing", "Body", "Benefit", "Resource", "Effort", "Email", "Card", "Sale", "Video", "Room", "Access", "Solution", "Step", "Anything", "Minute", "Account", "Decision", "Network", "House", "View", "Version", "Everything", "Amount", "Management", "Night", "Model", "Space", "Goal", "Feature", "Effect", "Role", "Field", "Material", "Credit", "Everyone", "Software", "Training", "Office", "Mind", "Age", "News", "I", "Phone", "Skill", "Parent", "Individual", "Relationship", "Control", "Computer", "Risk", "Employee", "Show", "Music", "Energy"];

function get_anonymous_name(){
	return adjectives[Math.floor(Math.random() * adjectives.length)] + " " + 
		nouns[Math.floor(Math.random() * nouns.length)];
};
