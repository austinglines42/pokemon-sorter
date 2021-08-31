import os, requests, json
from types import MethodDescriptorType

from flask import Flask, render_template, request, flash, redirect, session, g
# from flask_debugtoolbar import DebugToolbarExtension
from sqlalchemy.exc import IntegrityError
from forms import SignupForm, LoginForm, SelectGenerationForm
from models import db, connect_db, User, Pokemon, PokemonMove, Move, Generation, UserPokemon, PokemonType, Type

CURR_USER_KEY = "curr_user"

app = Flask(__name__)
if __name__ == "__main__":
    
    app.run(host='10.0.0.30')
    app.run(ssl_context='adhoc')

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///pokemon_sorter'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False

connect_db(app)
db.create_all()

# UserPokemon.__tablename__.drop()

app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', "it's a secret")
# toolbar = DebugToolbarExtension(app)


@app.before_request
def add_user_to_g():
    """Adds the current user to a global variable if the user is logged in."""
    if CURR_USER_KEY in session:
        g.user = User.query.get(session[CURR_USER_KEY])
    else:
        g.user = None

def do_login(user):
    """Logs a user into the site"""

    session[CURR_USER_KEY] = user.id

def do_logout():
    """Logs a user out of the site"""
    if CURR_USER_KEY in session:
        del session[CURR_USER_KEY]

def require_login():
    """checks if a user is logged in and returns them to the homepage if they are not."""

    if not g.user:
        flash("You must login to view this page.", "danger")
        return redirect("/login")

@app.route('/')
def home_page():
    """Routes the user to the homepage."""
    pokemon_list = UserPokemon.query.filter(UserPokemon.user_id==g.user.id)

    return render_template("home.html", pokemon_list=pokemon_list)

@app.route('/login', methods=["GET", "POST"])
def user_login_page():
    """Routes the user to the login page."""

    if g.user:
        return redirect("/")

    form = LoginForm()

    if form.validate_on_submit():
        user = User.authenticate(form.username.data, form.password.data)

        if user:
            do_login(user)
            flash(f'Sucessfully logged in!', 'success')
            return redirect('/')
    return render_template("/users/login.html", form=form)

@app.route('/signup', methods=['GET', 'POST'])
def user_signup_page():
    """Routes the user to a signup page"""

    if g.user:
        return redirect("/")

    form = SignupForm()
    
    if form.validate_on_submit():
        try:
            user = User.signup(username=form.username.data, password=form.password.data, email=form.email.data)
            db.session.commit()
        except IntegrityError:
            flash("Username already taken", 'danger')
            return render_template('users/signup.html', form=form)
        do_login(user)
        return redirect("/")
    return render_template("/users/signup.html", form=form)

@app.route('/logout')
def logout_user():
    if g.user:
        flash('You have been logged out', 'success')
        do_logout()
    return redirect('/')

@app.route('/users/<int:uid>')
def user_page(uid):
    """Routes the user to the selected user's page."""

    user = User.query.get_or_404(uid)
    pokemon_list = UserPokemon.query.filter(UserPokemon.user_id==uid)
    return render_template("/users/user_page.html", user = user, pokemon_list=pokemon_list)

@app.route('/users/<int:uid>/list')
def user_list(uid):
    """Routes the user to a page that displays the selected users' favorite pokemon"""

    pokemon = User.query.get_or_404(uid).pokemon
    return render_template("/users/user_list.html", pokemon = pokemon)

@app.route('/sorter')
def pokemon_sorter_page():
    """Redirects the user to the Pokemon sorter page."""

    if not g.user:
        flash("You must be logged in to sort pokemon.", 'danger')
        return redirect('/login')
    if g.user.save_list:
        print('loaded saved list')
        saveData = json.loads(g.user.save_list)
        return render_template('sorter.html', saveData=saveData)
    return render_template('sorter.html')

@app.route('/api/sorter/generate', methods=['POST'])
def generate_sort_list():
    """Generates the user's pokemon list"""
    resp = request.json.get('generations')
    gens = len(resp)
    if True not in resp:
        flash('Must select at least 1 generation', 'danger')
        return {'error':'none selected'}
    pokemon_list = []


    for gen_id in range(0, gens):
        if resp[gen_id]:
            pokemon_list.extend(get_generation_pokemon(gen_id+1))
        results = {
            'pokemon_list': pokemon_list
        }
    return results

@app.route('/api/sorter/save', methods=['POST'])
def save_to_database():
    resp =  request.json
    save_data = json.dumps(resp['saveData'])
    user_id = resp['user']
    user = User.query.get_or_404(user_id)
    user.save_list = save_data
    db.session.commit()
    return {'save_data':save_data}

@app.route('/api/sorter/delete', methods=['POST'])
def delete_save_data():
    resp =  request.json
    print(resp)
    user_id = resp['user']
    print(user_id)
    user = User.query.get_or_404(user_id)
    user.save_list = ''
    db.session.commit()
    return {'result':'success'}

@app.route('/api/pokemon/<int:id>')
def get_pokemmon_data(id):
    pokemon = Pokemon.query.get_or_404(id)
    return Pokemon.return_dict(pokemon)

@app.route('/make_list')
def make_user_pokemon_list():
    if g.user.id:
        user = User.query.get_or_404(g.user.id)
        id_list = json.loads(user.save_list).get('idList')
        id_list = id_list[1:-1]
        rank = 1
        for id in list(id_list.split(',')):
        
            new_user_pokemon = UserPokemon(user_id=g.user.id,  pokemon_id=id, rank=rank)
            rank +=1
            db.session.add(new_user_pokemon)
        try:
            db.session.commit()
            flash('Pokemon list created!', 'success')
        except:
            flash('List already exists!', 'danger')
    else:
        flash('Incorrect user.', 'danger')
    return redirect('/')



def get_generation_pokemon(gen_id):
    gen = Generation.query.get_or_404(gen_id)
    pokemon_list = gen.pokemon
    return [pokemon.id for pokemon in pokemon_list]

