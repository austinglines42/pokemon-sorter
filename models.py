import random, string
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import backref

bcrypt = Bcrypt()
db = SQLAlchemy()
    
BASE_URL = '/static/profile-pictures/'

def variant_letter(num=28):
    arr = [ el for el in string.ascii_uppercase]
    arr.extend(['EM','QM'])
    return arr[random.randint(0,num-1)]

def random_profile_pic():
    """Chooses a random profile picture for the user"""

    rng = random.randint(1,718)
    path = BASE_URL + str(rng)
    # Some pokemon have variant images so if the random number is one of the variants then it will choose which variant.
    if rng in [201,422,423,492,550,555,592,593,618,646,668,678]:
        if rng not in [201,646]:
            path += variant_letter(2)
        elif rng == 646:
            path += variant_letter(3)
        else:
            path += variant_letter(28)
    return path+'.png'


class User(db.Model):
    """User in the system."""

    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.Text, nullable=False, unique=True)
    email = db.Column(db.Text, nullable=False, unique=True)
    image_url = db.Column(db.Text)
    bio = db.Column(db.Text)
    location = db.Column(db.Text)
    password = db.Column(db.Text, nullable=False)
    save_list = db.Column(db.Text)

    pokemon = db.relationship('Pokemon', secondary='users_pokemon', backref='users')

    def __repr__(self):
        return f"<User #{self.id}: {self.username} {self.email}>"

    @classmethod
    def signup(cls, username, email, password):
        """Signs a upser up, hashes password, and adds user to system."""

        hashed_pwd = bcrypt.generate_password_hash(password).decode('UTF-8')
        image_url = random_profile_pic()

        user = User(
            username=username,
            email=email,
            password=hashed_pwd,
            image_url=image_url,
        )

        db.session.add(user)
        return user

    @classmethod
    def authenticate(cls, username, password):
        """Find user with `username` and `password`.

        This is a class method (call it on the class, not an individual user.)
        It searches for a user whose password hash matches this password
        and, if it finds such a user, returns that user object.

        If can't find matching user (or if password is wrong), returns False.
        """

        user = cls.query.filter(cls.username.ilike(username)).first()

        if user:
            is_auth = bcrypt.check_password_hash(user.password, password)
            if is_auth:
                return user
        return False

class UserPokemon(db.Model):
    """Pokemon prefferences for each user"""
    
    __tablename__ = 'users_pokemon'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key = True)
    pokemon_id = db.Column(db.Integer, db.ForeignKey('pokemon.id'), primary_key = True)
    rank = db.Column(db.Integer)
    note = db.Column(db.Text)

    pokemon = db.relationship('Pokemon')

class Pokemon(db.Model):
    """Pokemon for database"""

    __tablename__ = 'pokemon'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False)

    # Foreign keys for Pokemon
    generation_id = db.Column(db.Integer, db.ForeignKey('generations.id'), nullable=False)

    # Relationships for Pokemon
    generation = db.relationship("Generation", backref='pokemon')
    types = db.relationship('Type', secondary='pokemon_types', backref='pokemon')
    moves = db.relationship("Move", secondary='pokemon_moves', backref='pokemon')

    @classmethod
    def return_dict(cls, pokemon):
        return {
            'id': pokemon.id,
            'name': pokemon.name,
            'generation': pokemon.generation.region,
            'types': [Type.return_dict(type_) for type_ in pokemon.types],
            'moves': [Move.return_pokemon_move_dict(move) for move in pokemon.moves]
        }

class PokemonType(db.Model):
    """The type for each pokemon"""

    __tablename__ = 'pokemon_types'

    pokemon_id = db.Column(db.Integer, db.ForeignKey('pokemon.id'), primary_key = True)
    type_id = db.Column(db.Integer, db.ForeignKey('types.id'), primary_key = True)
    is_primary = db.Column(db.Boolean, default=True)

    @classmethod
    def generate_pokemon_types(cls, pokemon_id, type1_id, type2_id=None):
        poke_type1=PokemonType(
            pokemon_id=pokemon_id,
            type_id=type1_id,
            is_primary=True
        )
        db.session.add(poke_type1)
        if type2_id:
            poke_type2=PokemonType(
                pokemon_id=pokemon_id,
                type_id=type2_id,
                is_primary=False
            )
            db.session.add(poke_type2)

class Move(db.Model):
    """All the moves that different pokemon can have"""

    __tablename__ = 'moves'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False)
    damage_class = db.Column(db.Text)
    pp = db.Column(db.Integer)
    power = db.Column(db.Integer)
    accuracy = db.Column(db.Integer)

    type_id = db.Column(db.Integer, db.ForeignKey('types.id'))

    type = db.relationship('Type', backref='moves')

    @classmethod
    def return_dict(cls, move):
        return {
            'id': move.id,
            'name': move.name,
            'damage_class': move.damage_class,
            'pp': move.pp,
            'power': move.power,
            'accuracy': move.accuracy,
            'type': Type.return_dict(move.type),
            'learned_at': move.pokemon_move.learned_at
        }

    @classmethod
    def return_pokemon_move_dict(cls, move):
        return {
            'id': move.id,
            'name': move.name,
            'damage_class': move.damage_class,
            'pp': move.pp,
            'power': move.power,
            'accuracy': move.accuracy,
            'type': Type.return_dict(move.type),
            'learned_at': move.pokemon_move.learned_at
        }

class PokemonMove(db.Model):
    """Moves for each pokemon"""

    __tablename__ = 'pokemon_moves'

    pokemon_id = db.Column(db.Integer, db.ForeignKey('pokemon.id'), primary_key = True)
    move_id = db.Column(db.Integer, db.ForeignKey('moves.id'), primary_key = True)
    learned_at = db.Column(db.Integer, nullable=False)
    move = db.relationship('Move', backref=backref('pokemon_move', uselist=False))




class Generation(db.Model):
    """Pokemon generations for database"""

    __tablename__ = 'generations'

    id = db.Column(db.Integer, primary_key=True)
    region = db.Column(db.Text, nullable=False, unique=True)

class Type(db.Model):
    """Different types of pokemon"""

    __tablename__ = 'types'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False)

    @classmethod
    def return_dict(cls, type_):
        return {

            'id': type_.id,
            'name': type_.name
        }
    



    

def connect_db(app):
    """Connect this database to provided Flask app.

    You should call this in your Flask app.
    """

    db.app = app
    db.init_app(app)