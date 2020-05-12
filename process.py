import pandas as pd 

#load data that lives in scrubbed.csv 
data = pd.read_csv('scrubbed.csv', dtype = {"duration (seconds)": float, "latitude": float, "longitude": float})

#only extract USA UFO sightings 
usdata = data[(data['country'] == "us")]

#split datetime column into separate date and time columns, and index by date column 
usdata = usdata.join(usdata['datetime'].str.split(' ', 1, expand=True).rename(columns={0:'date', 1:'time'}))
#usdata = usdata.set_index('date')

#only keep the columns we need 
usdata = usdata.drop(columns = ['datetime', 'country', 'city', 'state', 'date posted', 'duration (hours/min)'])

#get rid of invalid dates 
usdata['date'] = pd.to_datetime(usdata.date, errors='coerce')
usdata = usdata.dropna(subset = ['date'])

#sort by date to see date range 
usdata.sort_values(by = 'date', inplace = True)

#write to file 
usdata.to_csv('ufousa.csv')