import axios from 'axios';

export async function getCsrfToken(){
    const res = await axios.get('http://localhost:5000/api/csrf-token', {
        withCredentials: true,
    })
    const data = res.data;
    return data.csrfToken;
}