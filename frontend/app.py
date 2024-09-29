from flask import Flask, render_template, session, redirect, url_for

app = Flask(__name__)

@app.route('/')
def login():
    return render_template('login.html', css_file='stylelogin.css', current_page='login')

@app.route('/create')
def create_profile():
    return render_template('createProfile.html', css_file='styleCreateProfile.css', current_page='create_profile')

@app.route('/profile')
def profile_card():
    return render_template('profileCard.html', css_file='profileCardStyle.css', current_page='profile_card')

@app.route('/preferences')
def roommate_preferences():
    return render_template('roommatePref.html', css_file='styleRoommatePref.css', current_page='roommate_preferences')

@app.route('/swipes')
def swipes():
    return render_template('swipes.html', css_file='swipesStyle.css', current_page='swipes')

@app.route('/matches')
def matches():
    return render_template('matches.html', css_file='styleMatches.css', current_page='matches')

if __name__ == '__main__':
    app.run(debug=True)
