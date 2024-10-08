import express from 'express'
import axios from "axios";
import dotenv from "dotenv";
import { MongoClient } from 'mongodb';
dotenv.config();

// const {MongoClient} = require('mongodb');
//type here the rest of the db connection

const app = express()
app.use(express.json())

app.get('/', function(req, res){
    res.send('working')

});
//search by query
app.get('/movies/search/', async(req, res) => {
    try{
        const { title } = req.query
        if(!title ) res.status(400).json({error: 'No title parameter'});

        const param = encodeURI(title)
        const API_KEY = process.env.OMDB_API_KEY

        const reponse = await axios.get(`http://www.omdbapi.com/?apikey=${API_KEY}&t=${param}`)
        
        const data = reponse.data
        // Title , Year , Rated , Release 
        //Runtime , Plot , Poster , imdbID , CombinedRating )
        
        const ratings = data.Ratings
        let score = 0.0
        ratings.map((rating) => {
            const { Source: source, Value: value } = rating
            const newValue = 0
            switch(source){
                case 'Internet Movie Database':
                    if(value === "10/10"){
                        score += 10
                        break;
                    }
                score += parseFloat(value.slice(0,3))
                break;
            case "Rotten Tomatoes":
                if(value === "100%"){
                    score += 10.00
                    break;
            }
                score += parseFloat(value.slice(0,2))/10

                break;
            case "Metacritic":
                if(value === "100/100"){
                    score += 10.00
                    break;
                }
                score += parseFloat(value.slice(0,2))/10

                break;
            default:
                break;
            }
        });

        const newScore = score / ratings.length
        const movie = {
            title: data.Title,
            year: data.Year,
            rated: data.Rated,
            release: data.Released,
            runtime: data.Runtime,
            plot: data.Plot,
            poster: data.Poster,
            imdbID: data.imdbID,
            score: newScore.toFixed(2)
            //use map for do the average operations
        };
       

        console.log(movie)
        res.send(movie)
        }
        catch(error){
            console.error(error)
        }
});

// const {MongoClient} = require('mongodb');
//type here the rest of the db connection
//search title
app.get('/', function(req, res){
    res.send('working')

});
const API = process.env.OMDB_API_KEY
app.get('/movies/search/:title', async (req, res) => {
    try {
        const title = req.params.title
        if (!title) res.status(400).json({ error: 'No title parameter' });
        
        const response = await axios.get(`http://www.omdbapi.com/?apikey=${API}&t=${title}`)
        const { data } = response

        const ratings = data.Ratings
        let score = 0.0

        ratings.map((rating) => {
            const { Source: source, Value: value } = rating
            const newValue = 0.0
            switch (source) {
                case "Internet Movie Database":
                    if (value === "10/10") {
                        score += 10.0
                        break;
                    }
                    score += parseFloat(value.slice(0, 2))
                    break;
                case "Rotten Tomatoes":
                    if (value === "100%") {
                        score += 100.0
                        break;
                    }
                    score += parseFloat(value.slice(0, 2)) / 10
                    break;
                case "Metacritic":
                    if (value === "100/100") {
                        score += 100.0
                        break;
                    }
                    score += parseFloat(value.slice(0, 2)) / 10
                    break;
                default:
                    break;
            }
        })
        const newScore = score / ratings.length
        const movie = {
            title: data.title,
            year: data.Year,
            rated: data.Rated,
            release: data.Release,
            runtime: data.Runtime,
            plot: data.Plot,
            poster: data.Poster,
            imdbID: data.imdbID,
            score: newScore.toFixed(2)
        }
        res.send(movie)
    } catch (error) {
        console.log(error)
    }
});

// Database Name
const dbName = "movies";

const mongoURI = process.env.MONGODB_URI;
console.log(mongoURI)
const client = new MongoClient(mongoURI);

async function connectDb() {
  await client.connect();
  console.log("Connected successfully to server");
  const db = client.db(dbName);
  const favorites_collection = db.collection("favorites");

  return { favorites_collection };
}

//Favorites

app.post("/favorites/:id", async (req, res) =>{
    const id = req.params.id
    if (!id) res.status(400).json({ error: 'No id parameter' });
    const response = await axios.get(`http://www.omdbapi.com/?apikey=${API}&i=${id}`)
    const { favorites_collection } = await connectDb();

    console.log(favorites_collection)
    const {data} = response

    const ratings = data.Ratings
    let score = 0.0

    ratings.map((rating) => {
        const { Source: source, Value: value } = rating
        switch (source) {
            case "Internet Movie Database":
                if (value === "10/10") {
                    score += 10.0
                    break;
                }
                score += parseFloat(value.slice(0, 2))
                break;
            case "Rotten Tomatoes":
                if (value === "100%") {
                    score += 100.0
                    break;
                }
                score += parseFloat(value.slice(0, 2)) / 10
                break;
            case "Metacritic":
                if (value === "100/100") {
                    score += 100.0
                    break;
                }
                score += parseFloat(value.slice(0, 2)) / 10
                break;
            default:
                break;
        }
    })
        const newScore = score / ratings.length

        const movie = {
            isDeleted: true,
            title: data.Title,
            year: data.Year,
            rated: data.Rated,
            release: data.Released,
            runtime: data.Runtime,
            plot: data.Plot,
            poster: data.Poster,
            imdbID: data.imdbID,
            score: newScore.toFixed(2)
            //Id {
            //tt0172495
            //tt0075148
            //tt0095765
            //tt1798709
            //tt6062774
            //tt7529298
            //}
        }
        //print movie
        const result = await favorites_collection.insertOne(movie)
        res.status(201).json(movie)
        console.log(movie)
});



app.get("/favorites/", async (req, res) => {
    try {
        const { favorites_collection } = await connectDb();
        const results = await favorites_collection.find({ isDeleted: { $ne: false } }).toArray();

        res.send(results)
         
    } catch (error) {
        res.status(500).send({ error: "An error occurred while fetching favorites." });
    }
});



app.post("/favorites/:id", async (req, res) => {
    const { id } = req.params;
    if (!imdbID) return res.status(400).json({ error: 'No imdbID parameter' });

    const result = await favorites_collection.updateOne(
        { imdbID: id },
        { $set: { isDeleted: false } },
    );
        res.status(200).json({ message: 'Movie soft deleted successfully'});
        console.log("Successfully soft deleted the data: " + JSON.stringify(result));
  });

app.listen(3000, () => console.log('Server is running in port 3000'))
