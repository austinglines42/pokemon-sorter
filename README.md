## 1. What goal will your website be designed to achieve?
This website will be designed to let users rank their favorite pokemon based on making comparisons between 2 pokemon to find which is their favorite.
## 2. What kind of users will visit your site? In other words, what is the demographic of your users? 
Fans of Pokemon.
## 3. What data do you plan on using? You may have not picked your actual API yet, which is fine, just outline what kind of data you would like it to contain.
I’m planning on using the Poke API to get lists of pokemon from different generations and store the data to try and make as few requests as possible.
## 4. In brief, outline your approach to creating your project (knowing that you may not know everything in advance and that these details might change later). Answer questions like the ones below, but feel free to add more information:
#### a. What does your database schema look like?
It will have a users table that will save the users’ site preferences and store their own pokemon rankings that they can edit and modify as they please.
#### b. What kinds of issues might you run into with your API?
Trying to figure out exactly how to implement the sorting and comparisons, I’m planning on using a slightly modified version of the merge sorting algorithm and use the user’s input to make the comparisons for where the merge sort will split the data.
#### c. Is there any sensitive information you need to secure?
I will be saving an encrypted user’s password.
#### d. What functionality will your app include?
I want people to be able to see images of the pokemon they’re choosing and have basic information on them to help them make their decisions.
#### e. What will the user flow look like?
The user will start by choosing which generation they would like to rank and then 2 random pokemon will pop up from the selected generations and they will pick which pokemon they like more. They will keep doing this until they have successfully made all the comparisons needed to sort out every pokemon.
#### f. What features make your site more than CRUD? Do you have any stretch goals?
It would like users to be able to look at other user’s rankings and have some way to compare it to their own. Maybe add sound effects for when they choose a pokemon and when new pokemon come in and some basic animations of the pokemon flying onto the screen with some way to mute the sounds that play.
