const useContants = () => {
  //const API_URL = "https://u6wawzlr6h.execute-api.ap-southeast-1.amazonaws.com/respiree-api/dev"
  const API_URL = "https://g154weo8i3.execute-api.us-east-1.amazonaws.com/prod"
  return {
    colors: {
      main: '#6F87FF',
      black: '#000',
      white: '#fff',
      blue: '#4059F3',
      yellow: '#fbc531',
      red: '#e74c3c',
      light: 'rgb(240, 240, 240)',
      grey: '#555',
      darkGrey: '#464646',
      lightGrey: '#dcdde1',
      greyOpacity: 'rgba(200, 200, 200, 0.7)',
      green: '#35D8BE',
      brownGrey: '#909090',
      very_light_grey:'#c6c6c6'
    },
    sizes: {
      xs: 4,
      s: 8,
      m: 16,
      l: 24,
      xl: 32,
      xxl: 40,
      margin: 20
    },
    options:{
      debug: false
    },
    apiUrl:{
      dashboard: API_URL+"/query/metrics",
      trends: API_URL+"/query/trends",
      //upload: "https://d3seui3i1l9ro8.cloudfront.net/dev/upload",
      upload: "https://d22o36iiapav1h.cloudfront.net/prod/upload",
      authentication: API_URL+"/query/getid"
    }
  }
}

export default useContants;
