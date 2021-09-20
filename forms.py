from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, IntegerField
from wtforms.fields.html5 import IntegerRangeField
from wtforms.validators import DataRequired, Email, Length, URL, Regexp, Optional, NumberRange

img_regex = '^.*.(apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)$'

class SignupForm(FlaskForm):
    """Form for adding users."""

    username = StringField('Username', validators=[DataRequired(), Length(max=12)])
    email = StringField('E-mail', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[Length(min=6)])

class EditUserForm(FlaskForm):
    """Form for editing user data."""

    # email = StringField('E-mail', validators=[Email()])
    # image_url = StringField('Profile Picture', validators=[Regexp(img_regex)])
    location = StringField("location", validators=[Length(max=64)])
    bio = TextAreaField('Bio', validators=[Length(max=256)])
    password = PasswordField('Current Password', validators=[Length(min=6)])

class LoginForm(FlaskForm):
    """Form for logging a user in"""

    username = StringField('Username',  validators=[DataRequired()])
    password = PasswordField("Password", validators=[Length(min=6)])

# class SelectGenerationForm(FlaskForm):
#     """Let's the user select the generation(s) they will be sorting"""

#     Gen1 = BooleanField('Kanto (Gen 1)')
#     Gen2 = BooleanField('Johto (Gen 2)')
#     Gen3 = BooleanField('Hoenn (Gen 3)')
#     Gen4 = BooleanField('Sinnoh (Gen 4)')
#     Gen5 = BooleanField('Unova (Gen 5)')
#     Gen6 = BooleanField('Kalos (Gen 6)')
#     Gen7 = BooleanField('Alola (Gen 7)')
#     Gen8 = BooleanField('Galar (Gen 8)')

class EditUserPokemon(FlaskForm):
    """Edits a pokemon on a user's pokemon list."""

    note = TextAreaField('Note')