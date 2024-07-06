import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const REST_API_KEY = process.env.KAKAO_CLIENT_ID;
const REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is missing' });
    }

    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: {
        grant_type: 'authorization_code',
        client_id: REST_API_KEY,
        redirect_uri: REDIRECT_URI,
        code: code,
      },
    });

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const user = userResponse.data;
    const profile_nickname = user.kakao_account.profile.nickname;

    const yourToken = jwt.sign(
      {
        name: profile_nickname,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token: yourToken });
  } catch (error) {
    console.error('Error during Kakao login:', error.message);
    if (error.response) {
      console.error('Kakao API response:', error.response.data);
    }
    res.status(500).json({ error: 'Failed to log in with Kakao', message: error.message });
  }
};
