const apiURL = 'https://pokeapi.co/api/v2/pokemon/';
const speciesURL = 'https://pokeapi.co/api/v2/pokemon-species/';
const pokemonNames = [
    'charizard', 'bulbasaur', 'squirtle', 'jigglypuff', 'gengar', 
    'eevee', 'mewtwo', 'lucario', 'snorlax', 'dragonite', 
    'gyarados', 'blaziken', 'greninja', 'machamp', 'pikachu'
];

let pokemonList = [];
let selectedPokemon = [];

// Fetch Pokémon data from API
async function fetchPokemonData() {
    const promises = pokemonNames.map(name => fetch(`${apiURL}${name}`).then(response => response.json()));
    pokemonList = await Promise.all(promises);
    renderPokemonCards();
}

// Fetch additional Pokémon data like species, color, and shape
async function fetchPokemonSpeciesData(pokemon) {
    const speciesResponse = await fetch(`${speciesURL}${pokemon.id}`);
    return await speciesResponse.json();
}

// Pokemon  info and Cry
function renderPokemonCards() {
    const pokemonGrid = document.querySelector('.pokemon-grid');
    pokemonList.forEach((pokemon, index) => {
        const card = document.createElement('div');
        card.classList.add('pokemon-card');
        card.dataset.index = index;

        card.innerHTML = `
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <h3>${pokemon.name}</h3>
            <button class="info-btn">Info</button>
            <button class="cry-btn">Cry</button>
        `;

        // Add event listeners for buttons and card clicks
        card.querySelector('.info-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click from being triggered
            showPokemonDetails(index);
        });

        card.querySelector('.cry-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click from being triggered
            playPokemonCry(pokemon);
        });

        card.addEventListener('click', () => {
            selectOrDeselectPokemon(index, card);
        });

        pokemonGrid.appendChild(card);
    });
}

// fetching data from API
async function showPokemonDetails(index) {
    const pokemon = pokemonList[index];
    const speciesData = await fetchPokemonSpeciesData(pokemon);

    const name = pokemon.name;
    const height = pokemon.height;
    const weight = pokemon.weight;
    const abilities = pokemon.abilities.map(ability => ability.ability.name).join(', ');
    const moves = pokemon.moves.slice(0, 5).map(move => move.move.name).join(', '); // Limit to 5 moves for brevity
    const color = speciesData.color.name;
    const shape = speciesData.shape.name;
    const eggGroups = speciesData.egg_groups.map(group => group.name).join(', ');
    const baseStats = pokemon.stats.map(stat => `${stat.stat.name}: ${stat.base_stat}`).join(', ');

    const modalContent = `
        <h2>${name.toUpperCase()}</h2>
        <img src="${pokemon.sprites.front_default}" alt="${name}">
        <p><strong>Height:</strong> ${height}</p>
        <p><strong>Weight:</strong> ${weight}</p>
        <p><strong>Abilities:</strong> ${abilities}</p>
        <p><strong>Moves:</strong> ${moves}</p>
        <p><strong>Base Stats:</strong> ${baseStats}</p>
        <p><strong>Color:</strong> ${color}</p>
        <p><strong>Shape:</strong> ${shape}</p>
        <p><strong>Egg Groups:</strong> ${eggGroups}</p>
    `;

    showModal(modalContent);
}

// function for sound of pokemon cry
function playPokemonCry(pokemon) {
    const cryUrl = `https://play.pokemonshowdown.com/audio/cries/${pokemon.name}.mp3`;
    const audio = new Audio(cryUrl);
    audio.play();
}


function showModal(content) {
    const modal = document.querySelector('.modal');
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = content;
    modal.style.display = 'block';
}


function closeModal() {
    const modal = document.querySelector('.modal');
    modal.style.display = 'none';
}


window.onclick = function(event) {
    const modal = document.querySelector('.modal');
    if (event.target === modal) {
        closeModal();
    }
};


function selectOrDeselectPokemon(index, cardElement) {
    const isSelected = selectedPokemon.includes(index);
    
    if (isSelected) {
        // for deselect Pokémon
        selectedPokemon = selectedPokemon.filter(pokemonIndex => pokemonIndex !== index);
        cardElement.classList.remove('selected');
    } else {
        if (selectedPokemon.length >= 2) {
            alert('You can only select two Pokémon for battle.');
            return;
        }

        selectedPokemon.push(index);
        cardElement.classList.add('selected');
    }

    document.querySelector('#battleBtn').disabled = selectedPokemon.length !== 2;
}

function initiateBattle() {
    if (selectedPokemon.length !== 2) {
        alert('Select two Pokémon for battle!');
        return;
    }

    const [pokemonIndex1, pokemonIndex2] = selectedPokemon;
    const pokemon1 = pokemonList[pokemonIndex1];
    const pokemon2 = pokemonList[pokemonIndex2];


    const pokemon1TotalStats = pokemon1.stats.reduce((total, stat) => total + stat.base_stat, 0);
    const pokemon2TotalStats = pokemon2.stats.reduce((total, stat) => total + stat.base_stat, 0);

    const movesUsed = {
        [pokemon1.name]: pokemon1.moves.slice(0, 2).map(move => move.move.name), 
        [pokemon2.name]: pokemon2.moves.slice(0, 2).map(move => move.move.name)
    };

    let winner = '';
    if (pokemon1TotalStats > pokemon2TotalStats) {
        winner = pokemon1.name;
    } else if (pokemon2TotalStats > pokemon1TotalStats) {
        winner = pokemon2.name;
    } else {
        winner = 'It’s a draw!';
    }

    const damageCaused = {
        [pokemon1.name]: calculateDamage(pokemon1, pokemon2),
        [pokemon2.name]: calculateDamage(pokemon2, pokemon1)
    };

    showBattleResults(winner, movesUsed, damageCaused);
}


function calculateDamage(attacker, defender) {
    const attackStat = attacker.stats.find(stat => stat.stat.name === 'attack').base_stat;
    const defenseStat = defender.stats.find(stat => stat.stat.name === 'defense').base_stat;
    return attackStat - defenseStat > 0 ? attackStat - defenseStat : 0; // Simple damage calculation
}


function showBattleResults(winner, movesUsed, damageCaused) {
    const resultContainer = document.querySelector('.battle-results');
    resultContainer.innerHTML = `
        <h2>Battle Results</h2>
        <p><strong>Winner:</strong> ${winner}</p>
        <p><strong>Moves Used:</strong></p>
        <p>${movesUsed[Object.keys(movesUsed)[0]].join(', ')} (by ${Object.keys(movesUsed)[0]})</p>
        <p>${movesUsed[Object.keys(movesUsed)[1]].join(', ')} (by ${Object.keys(movesUsed)[1]})</p>
        <p><strong>Damage Caused:</strong></p>
        <p>${Object.keys(damageCaused)[0]} dealt ${damageCaused[Object.keys(damageCaused)[0]]} damage.</p>
        <p>${Object.keys(damageCaused)[1]} dealt ${damageCaused[Object.keys(damageCaused)[1]]} damage.</p>
    `;
    resultContainer.style.display = 'block';
}


document.addEventListener('DOMContentLoaded', () => {
    fetchPokemonData();
    document.querySelector('#battleBtn').addEventListener('click', initiateBattle);  
    document.querySelector('.modal-close').addEventListener('click', closeModal);
});
