from requests.api import get, request
from models import User, Pokemon, PokemonMove, Move, Generation, UserPokemon, PokemonType, Type
import requests, re
from app import db

URL = 'https://pokeapi.co/api/v2'
GET_ID_REGEX_URL = '(?<=\/)\d*(?=\/$)'


##### commented out so that database isn't deleted if the file is accidentally ran.
# db.drop_all()
# db.create_all()


def get_id(url):
    """Gets the id from an api url"""

    return re.search(GET_ID_REGEX_URL, url)[0]

def get_en_name(arr):
    """Gets the english name from a language array"""

    for l in arr:
        if l.get('language').get('name') == 'en':
            return l.get('name')


def generate_pokemon(pokemon_species_list, generation_id):
    """Takes a list of pokemon and generates each pokemon and their moves/types"""

    # List of pokemon from the response to reduce api requests
    pokemon_list = []
    for pokemon in pokemon_species_list:
        id = get_id(pokemon.get('url'))
        resp = requests.get(f'{URL}/pokemon/{id}').json()
        pokemon_list.append(resp)
        name = resp.get('name').capitalize()
        new_pokemon = Pokemon(id=id, name=name, generation_id=generation_id)
        db.session.add(new_pokemon)
        print(f'{id}: {name}')
    db.session.commit()

    # Generates the moves and types for each pokemon
    for pokemon in pokemon_list:
        moves = pokemon.get('moves')
        pokemon_id = pokemon.get('id')
        generate_pokemon_moves(pokemon_id, moves)

        # Adds the pokemon's type(s)
        types = pokemon.get('types')
        if len(types) == 1:
            PokemonType.generate_pokemon_types(pokemon_id, get_id(types[0].get('type').get('url')))
        else:
            PokemonType.generate_pokemon_types(pokemon_id, get_id(types[0].get('type').get('url')) , get_id(types[1].get('type').get('url')))
    db.session.commit()

def generate_pokemon_moves(pokemon_id, moves):
    """Takes in a pokemon's id and a list of it's moves and adds each of it's moves to the database"""

    for move in moves:
        if move.get('version_group_details')[0].get('move_learn_method').get('name')=='level-up':
            new_pokemon_move = PokemonMove(
                move_id = get_id(move.get('move').get('url')),
                pokemon_id = pokemon_id,
                learned_at = move.get('version_group_details')[0].get('level_learned_at')
            )
            db.session.add(new_pokemon_move)
    db.session.commit()


def generate_moves(num_moves=None):
    """Generates all pokemon moves"""
    
    start = 1
    end = None
    if num_moves:
        if num_moves[0]:
            start = num_moves[0]
        if num_moves[1]:
            end = num_moves[1]
    if not end:
        resp = requests.get(f'{URL}/move/?limit=1').json()
        end = resp['count']

    for move in range(start, end+1):
        resp = requests.get(f'{URL}/move/{move}')
        if resp.status_code == 404:
            break
        resp = resp.json()
        damage_class = None
        # Some moves do not have a damage class so this is to prevent errors.
        if resp.get('damage_class'):
            damage_class = resp.get('damage_class').get('name')
        # Print statement to keep track of progress.
        print(f'{move}: {resp.get("name")}')
        new_move = Move(
            id = resp.get('id'),
            name = get_en_name(resp.get('names')),
            damage_class = damage_class,
            pp = resp.get('pp'),
            power = resp.get('power'),
            accuracy = resp.get('accuracy'),
            type_id = get_id(resp.get('type').get('url'))
        )
        db.session.add(new_move)
    db.session.commit()

    # The moves API has gaps in the ids so this will find the next id and go to it.
    if move != end:
        resp = requests.get(f'{URL}/move/?limit=1&offset={move-1}').json()
        new_start = int(get_id(resp.get('results')[0].get('url')))
        new_end = int(new_start)+(end-move)
        generate_moves([new_start, new_end])
        

def generate_types(num_types=None):
    """Adds all the different pokemon types to the database"""

    q = ''
    if num_types:
        q = f'?limit={num_types[1]-num_types[0]}&offset={num_types[0]}'
    resp = requests.get(f'{URL}/type{q}').json()
    for pokemon_type in resp.get('results'):
        new_type = Type(
            name = pokemon_type.get('name').capitalize(),
            id = get_id(pokemon_type.get('url'))
        )
        db.session.add(new_type)
    db.session.commit()

def generate_generations(num_generations=None):
    """Goes through every generation and adds the generation and pokemon in that generation"""

    start = 1
    end = None
    # Checks to see where it is starting
    if num_generations:
        if num_generations[0]:
            start = num_generations[0]
        if num_generations[1]:
            end = num_generations[1]+1
    if not end:
        resp = requests.get(f'{URL}/generation/?limit=1').json()
        end = resp["count"]+1
    pokemon_lists = []
    
    # loads each generation into the database based on the specified range.
    for num in range(start, end):
        resp = requests.get(f'{URL}/generation/{num}').json()
        new_generation = Generation(
            id = num,
            region = resp.get('main_region').get('name').capitalize()
        )
        db.session.add(new_generation)
        pokemon_lists.append(resp.get('pokemon_species'))
    db.session.commit()

    # Goes through the previously generated pokemon_lists and sends each list and generation id to the generate_pokemon function
    gen = 1
    for p in pokemon_lists:
        generate_pokemon(p, gen)
        gen += 1
        
def populate_database(num_types = None, num_moves = None, num_generations = None):
    """Populates the database in the correct order to avoid errors."""

    generate_types(num_types)
    generate_moves(num_moves)

    # generate_pokemon ran from inside of generate_generations to reduce api requests
    # generate_pokemon_moves and generate_pokemon_types ran from inside of generate_pokemon to reduce api requests
    generate_generations(num_generations)


#test_user = User.signup(username='test', password='test', email='test@test.email')


populate_database()