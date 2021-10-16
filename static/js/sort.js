// Base URL for each pokemon's artwork
const ART_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

// Template for each pokemon's moves
const MOVE_TEMPLATE = `<table class="table table-striped table-responsive p-0 w-75 mx-auto my-1 table-dark border rounded">
    <thead>
        <tr>
            <th colspan="2" class='move-name fw-bold text-center'></th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Damage Class</td>
            <td class='move-damage-class'></td>
        </tr>
        <tr>
            <td>PP</td>
            <td class='move-pp'></td>
        </tr>
        <tr>
            <td>Power</td>
            <td class='move-power'></td>
        </tr>
        <tr>
            <td>Accuracy</td>
            <td class='move-accuracy'></td>
        </tr>
        <tr>
            <td>Type</td>
            <td class='move-type'></td>
        </tr>
        <tr>
            <td>Learned at</td>
            <td class='move-learned-at'></td>
        </tr>
    </tbody>
</table>`;

////////// Initializing values for sorting. //////////
// Stores the list of all the pokemon ids.
let idList = [];

// Stores the current position of the left array.
let currentL = 0;

// Stores the current position of the right array.
let currentR = 0;

// Stores the position in leftArr and rightArr.
let position = 0;

// Starting position of array in idList.
let left = 0;

// Ending position of array in idList.
let right = 0;

// Middle of array in idList.
let middle = 0;

// Stores left side of the array positions for idList
let leftArr = [];

// Stores right side of the array positions for idList
let rightArr = [];

// Creates a temporary array for pushing data into the main array.
let tempArr = [];

// List of all pokemon.
let pokemonList = [];

// Stores the last left position
let lastL = 0;

// Stores the last right position.
let lastR = 0;

// Boolean for letting buttons be clickable.
let clickable = true;

// Data for left pokemon
let pokemon1 = null;

// Data for right pokemon.
let pokemon2 = null;

// Boolean to confirm a user wants to delete their save data and list.
let deleteSaveConfirmation = false;

// Boolean for checking if the page is currently loading.
let waitResponse = false;

//JQuery selectors
let $loadingSpin = $('#loading-spinner');
let $btn1 = $('#choose-1');
let $btn2 = $('#choose-2');
let $moveTemplate = $('move-table-template');
let $sortContainer = $('#sort-container');
let $pokemonOne = $('#pokemon-one-container');
let $pokemonTwo = $('#pokemon-two-container');
let $sortController = $('#sort-controller');
let $generationFormContainer = $('#generation-form-container');
let $gens = [];

// Loads save data when the page has loaded.
$(document).ready(function() {
	if (sessionStorage.getItem('idList')) {
		if ($('#save-div').text) {
		}
		loadSaveData();
	}
});

// Loads generations into the page.
for (let i = 1; i <= 8; i++) {
	$gens.push($(`#generation-${i}`));
}

// Delete's the user's save data.
async function deleteSaveData() {
	if (deleteSaveConfirmation) {
		sessionStorage.clear();
		// await axios.post('/api/sorter/delete', {
		// 	user: get_id()
		// });
		window.location.replace('/sorter/delete');
	}
	$('#delete-save-data h1').text('Are you sure?');
	deleteSaveConfirmation = true;
	setTimeout(() => {
		$('#delete-save-data h1').text('Start over');
		deleteSaveConfirmation = false;
	}, 2000);
}

// Saves the user's data into the session storage.
function saveinStorage() {
	sessionStorage.setItem('idList', JSON.stringify(idList));
	sessionStorage.setItem('currentL', currentL);
	sessionStorage.setItem('currentR', currentR);
	sessionStorage.setItem('left', left);
	sessionStorage.setItem('right', right);
	sessionStorage.setItem('tempArr', JSON.stringify(tempArr));
	sessionStorage.setItem('position', position);
}

// Submits the generation data to the server and returns a list of pokemon for the selected generations.
async function submitGeneration(evt) {
	evt.preventDefault();
	let generations = [];
	for (let i = 1; i < $gens.length + 1; i++) {
		generations.push($gens[i - 1].is(':checked'));
	}
	resp = await axios.post('/api/sorter/generate', {
		generations
	});
	if (resp.data['error']) {
		window.location.replace('/sorter');
	}
	pokemonList = resp.data['pokemon_list'];
	start_sort(pokemonList);
}

// Loads save data from session storage.
function loadSaveData() {
	position = parseInt(sessionStorage.getItem('position'));
	left = parseInt(sessionStorage.getItem('left'));
	right = parseInt(sessionStorage.getItem('right'));
	idList = JSON.parse(sessionStorage.getItem('idList'));
	currentL = parseInt(sessionStorage.getItem('currentL'));
	currentR = parseInt(sessionStorage.getItem('currentR'));
	tempArr = JSON.parse(sessionStorage.getItem('tempArr'));
	middle = left + parseInt((right - left) / 2);
	leftArr = [];
	rightArr = [];
	generatePositions(0, idList.length - 1);
	showSorter();
	buttonsOn(false);
	preloadImages();
	loadPokemonData();
}

// Setup for all pokemon sorting.
function start_sort(pokemonList) {
	idList = pokemonList;
	leftArr = [];
	rightArr = [];
	position = 0;
	generatePositions(0, idList.length - 1);
	preloadImages();
	initializeValues();
	showSorter();
}

// Displays the sorter.
function showSorter() {
	$generationFormContainer.addClass('d-none');
	$sortContainer.removeClass('d-none');
}

// Loads the pokemon data into the sorter.
async function loadPokemonData() {
	buttonsOn(false);
	pokemon1 = idList[currentL];
	resp = await axios.get(`/api/pokemon/${idList[currentL]}`);
	poke1 = resp.data;
	pokemon2 = idList[currentR];
	resp = await axios.get(`/api/pokemon/${idList[currentR]}`);
	poke2 = resp.data;
	loadHTML(poke1, 1);
	loadHTML(poke2, 2);
	generateMoveList(poke1, 1);
	generateMoveList(poke2, 2);
	buttonsOn(true);
	saveinStorage();
}

// Allows the user to click on the buttons.
function buttonsOn(on) {
	if (on) {
		$loadingSpin.addClass('d-none');
		clickable = true;
	} else {
		clickable = false;
		$loadingSpin.removeClass('d-none');
	}
}

// Estimated number of comparisons to sort the list.
function estimatedComparisons() {
	n = idList.length;
	result = n * Math.log(n) - Math.pow(2, Math.log(n)) + 1;
	return Math.floor(result);
}

// Saves a copy of the session storage data to the database.
async function saveToServer() {
	let idList = sessionStorage.getItem('idList');
	let currentL = parseInt(sessionStorage.getItem('currentL'));
	let currentR = parseInt(sessionStorage.getItem('currentR'));
	let left = parseInt(sessionStorage.getItem('left'));
	let right = parseInt(sessionStorage.getItem('right'));
	let tempArr = sessionStorage.getItem('tempArr');
	let position = parseInt(sessionStorage.getItem('position'));

	saveData = {
		idList: idList,
		currentL: currentL,
		currentR: currentR,
		left: left,
		right: right,
		tempArr: tempArr,
		position: position
	};
	resp = await axios.post('/api/sorter/save', {
		saveData: saveData,
		user: get_id()
	});
	waitResponse = true;
}

// Called when the user selects the left pokemon.
function leftWin() {
	if (clickable) {
		tempArr.push(idList[currentL]);
		currentL++;
		if (currentL > middle) {
			while (currentR <= right) {
				tempArr.push(idList[currentR]);
				currentR++;
			}
			reposition();
		} else {
			loadPokemonData();
		}
	}
}

// Called when the user selects the right pokemon.
function rightWin() {
	if (clickable) {
		tempArr.push(idList[currentR]);
		currentR++;
		if (currentR > right) {
			while (currentL <= middle) {
				tempArr.push(idList[currentL]);
				currentL++;
			}
			reposition();
		} else {
			loadPokemonData();
		}
	}
}

// Repositions the position in the leftArr and rightArr.
function reposition() {
	for (let i = 0; i < tempArr.length; i++) {
		idList[left + i] = tempArr[i];
	}
	position++;
	if (!finishedSorting()) {
		initializeValues();
	}
}

// Detects if the user has sorted all pokemon.
function finishedSorting() {
	if (position < leftArr.length) {
		return false;
	}
	saveToServer();
	// axios.post('/make_list', {
	// 	list: idList
	// });
	waiting = setInterval(() => {
		if (waitResponse) {
			window.location.replace('/make_list');
			clearInterval(waiting);
		}
	}, 100);
	return true;
}

// Preloads all images for faster loading.
function preloadImages() {
	idList.forEach(function(id) {
		let $newImage = $('#image-preloader').clone();
		$newImage.attr('src', `${ART_URL}${id}.png`);
		$('#image-preloader-container').append();
	});
}

// Initializes all if it is the first time loading the page.
function initializeValues() {
	left = leftArr[position];
	right = rightArr[position];
	middle = left + parseInt((right - left) / 2);
	currentL = left;
	currentR = middle + 1;
	tempArr = [];
	loadPokemonData();
}

// Recursive funciton that generates the different positions for leftArr and rightArr based on the MergeSort algorithm
function generatePositions(left, right) {
	if (left >= right) {
		return;
	}
	let middle = left + parseInt((right - left) / 2);
	generatePositions(left, middle);
	generatePositions(middle + 1, right);
	leftArr.push(left);
	rightArr.push(right);
}

// Loads the HTML for the pokemon.
function loadHTML(pokemon, side) {
	$selector = $(`#pokemon-${side}-container`);
	$selector.find('img').first().attr('src', `${ART_URL}${pokemon.id}.png`);
	$selector.find('.pokemon-id').first().text(pokemon.id);
	$selector.find('.pokemon-name').first().text(pokemon.name);
	$selector.find('.pokemon-region').first().text(pokemon.generation);
	if (pokemon.types.length == 1) {
		$selector.find('.pokemon-type').first().text(pokemon.types[0].name);
	} else {
		$selector.find('.pokemon-type').first().text(`${pokemon.types[0].name}, ${pokemon.types[1].name}`);
	}
}

// Gets the current user's id
function get_id() {
	return $('.user-link').attr('id');
}

// Generates the move list for the current pokemon
function generateMoveList(pokemon, side) {
	$selector = $(`#move-${side}-table`);
	$selector.html('');
	pokemon.moves.forEach(function(move) {
		$template = $('<div>').html(MOVE_TEMPLATE);
		$template.find('.move-name').text(move.name);
		$template.find('.move-damage-class').text(move.damage_class);
		$template.find('.move-pp').text(move.pp);
		$template.find('.move-power').text(move.power);
		$template.find('.move-accuracy').text(move.accuracy);
		$template.find('.move-type').text(move.type.name);
		$template.find('.move-learned-at').text(move.learned_at);
		$selector.append($template);
	});
}

// function for debugging the script.
function debug(where, extraName = '', extraVal = '') {
	console.log(`${where} ${extraName} ${extraVal}`);
	console.log(
		`left:${left} ----- right:${right} ----- currentL:${currentL} ----- currentR:${currentR} ----- middle:${middle} ----- tempArr= ${tempArr} ----- idList:${idList}`
	);
}

// Saves the progress to the server.
$('#save-progress').on('click', saveToServer);
// Sends the generation information to the server to generate a pokemon list.
$('#generation-form').on('submit', submitGeneration);
// Delete's the current user's save data.
$('#delete-save-data').on('click', deleteSaveData);
// Selects the left pokemon.
$('#choose-1').on('click', leftWin);
// Selects the right pokemon.
$('#choose-2').on('click', rightWin);
