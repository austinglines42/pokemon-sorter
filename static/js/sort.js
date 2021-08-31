const ART_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

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

let idList = [];
let currentL = 0;
let currentR = 0;
let position = 0;
let left = 0;
let right = 0;
let middle = 0;
let leftArr = [];
let rightArr = [];
let tempArr = [];
let pokemonList = [];
let lastL = 0;
let lastR = 0;
let clickable = true;
let pokemon1 = null;
let pokemon2 = null;
let deleteSaveConfirmation = false;
let waitResponse = false;

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
$(document).ready(function() {
	if (sessionStorage.getItem('idList')) {
		if ($('#save-div').text) {
		}
		loadSaveData();
	}
});

for (let i = 1; i <= 8; i++) {
	$gens.push($(`#generation-${i}`));
}

async function deleteSaveData() {
	if (deleteSaveConfirmation) {
		sessionStorage.clear();
		await axios.post('/api/sorter/delete', {
			user: get_id()
		});
		window.location.replace('/sorter');
	}
	$('#delete-save-data h1').text('Are you sure?');
	deleteSaveConfirmation = true;
	setTimeout(() => {
		$('#delete-save-data h1').text('Start over');
		deleteSaveConfirmation = false;
	}, 5000);
}

function saveinStorage() {
	sessionStorage.setItem('idList', JSON.stringify(idList));
	sessionStorage.setItem('currentL', currentL);
	sessionStorage.setItem('currentR', currentR);
	sessionStorage.setItem('left', left);
	sessionStorage.setItem('right', right);
	sessionStorage.setItem('tempArr', JSON.stringify(tempArr));
	sessionStorage.setItem('position', position);
}

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

function start_sort(pokemonList) {
	// ONLY FOR TESTING
	// idList = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
	idList = pokemonList;
	leftArr = [];
	rightArr = [];
	position = 0;
	generatePositions(0, idList.length - 1);
	preloadImages();
	initializeValues();
	showSorter();
}

function showSorter() {
	$generationFormContainer.addClass('d-none');
	$sortContainer.removeClass('d-none');
}

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

function buttonsOn(on) {
	if (on) {
		$loadingSpin.addClass('d-none');
		clickable = true;
	} else {
		clickable = false;
		$loadingSpin.removeClass('d-none');
	}
}

function estimatedComparisons() {
	n = idList.length;
	result = n * Math.log(n) - Math.pow(2, Math.log(n)) + 1;
	return Math.floor(result);
}

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

function reposition() {
	for (let i = 0; i < tempArr.length; i++) {
		idList[left + i] = tempArr[i];
	}
	position++;
	if (!finishedSorting()) {
		initializeValues();
	}
}

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

function preloadImages() {
	idList.forEach(function(id) {
		let $newImage = $('#image-preloader').clone();
		$newImage.attr('src', `${ART_URL}${id}.png`);
		$('#image-preloader-container').append();
	});
}

function initializeValues() {
	left = leftArr[position];
	right = rightArr[position];
	middle = left + parseInt((right - left) / 2);
	currentL = left;
	currentR = middle + 1;
	tempArr = [];
	loadPokemonData();
}

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

function get_id() {
	return $('.user-link').attr('id');
}

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

function debug(where, extraName = '', extraVal = '') {
	console.log(`${where} ${extraName} ${extraVal}`);
	console.log(
		`left:${left} ----- right:${right} ----- currentL:${currentL} ----- currentR:${currentR} ----- middle:${middle} ----- tempArr= ${tempArr} ----- idList:${idList}`
	);
}

$('#save-progress').on('click', saveToServer);
$('#generation-form').on('submit', submitGeneration);
$('#delete-save-data').on('click', deleteSaveData);
$('#choose-1').on('click', leftWin);
$('#choose-2').on('click', rightWin);
