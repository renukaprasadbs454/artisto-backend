import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * GET /api/v1/movies/search
 * Search for movies via TMDb API to hide the API key from the frontend.
 */
export async function searchMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      res.status(400).json({ error: { message: 'Query parameter q is required' } });
      return;
    }

    if (!TMDB_API_KEY) {
      // In development, if they haven't set an API key yet, return mock results so the UI doesn't break
      res.status(200).json({
        data: [
          {
            tmdbMovieId: 1,
            title: `Mock Movie for "${query}"`,
            releaseYear: 2024,
            posterUrl: 'https://via.placeholder.com/200x300.png?text=Mock+Poster'
          }
        ]
      });
      return;
    }

    const { data } = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        include_adult: false,
      }
    });

    const mappedResults = data.results.map((movie: any) => ({
      tmdbMovieId: movie.id,
      title: movie.title,
      releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : undefined,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : undefined,
    }));

    res.status(200).json({ data: mappedResults });
  } catch (err: any) {
    console.error('TMDb Error:', err.message);
    res.status(500).json({ error: { message: 'Failed to search movies' } });
  }
}
