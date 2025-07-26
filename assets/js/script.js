 const movieContainer = document.getElementById('movieContainer');
    const loader = document.querySelector('.loader');
    const modal = document.getElementById('movieModal');
    const modalContent = modal.querySelector('.modal-content');
    const closeBtn = modal.querySelector('.close');
    const playBtn = modal.querySelector('.play-button');
    const videoContainer = modal.querySelector('.video-container');
    const videoIframe = videoContainer.querySelector('iframe');
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const languageFilter = document.getElementById('languageFilter');
    const sortFilter = document.getElementById('sortFilter');
    const sortOrderFilter = document.getElementById('sortOrderFilter');
    const browseOptions = document.querySelectorAll('.browse-option');
    const hero = document.querySelector('.hero');
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');
    const signUpBtn = document.querySelector('.signup-btn');
    const signUpModal = document.querySelector('.signup-modal');
    const signUpCloseBtn = signUpModal.querySelector('.close');

    let page = 1;
    let isLoading = false;
    let currentFilters = {
      with_genres: '',
      year: '',
      with_original_language: '',
      sort_by: 'popularity.desc'
    };
    let currentType = 'movie';
    let heroBackgrounds = [];
    let currentHeroIndex = 0;
    let searchTimeout;

    function createMovieCard(item) {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.innerHTML = `
        <div class="movie-poster" style="background-image: url(https://image.tmdb.org/t/p/w500${item.poster_path})"></div>
        <div class="movie-info">
          <div class="movie-title">${item.title || item.name}</div>
          <div class="movie-rating">⭐ ${item.vote_average.toFixed(1)}</div>
        </div>
      `;
      card.addEventListener('click', () => showMovieDetails(item));
      return card;
    }

    async function showMovieDetails(item) {
      try {
        const detailResponse = await axios.get(`https://api.themoviedb.org/3/${currentType}/${item.id}`, {
          params: {
            api_key: '15d2ea6d0dc1d476efbca3eba2b9bbfb',
            language: 'fr-FR'
          }
        });
        
        const detailedItem = detailResponse.data;
        
        modalContent.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 100%), url(https://image.tmdb.org/t/p/original${item.backdrop_path})`;
        modal.querySelector('.modal-title').textContent = detailedItem.title || detailedItem.name;
        modal.querySelector('.modal-overview').textContent = detailedItem.overview;
        modal.querySelector('.modal-info').innerHTML = `
          <p>Note : ⭐ ${detailedItem.vote_average.toFixed(1)}</p>
          <p>Date de sortie : ${detailedItem.release_date || detailedItem.first_air_date}</p>
        `;
        playBtn.onclick = () => playMovie(item.id);
        modal.style.display = 'block';
      } catch (error) {
        console.error('Error fetching detailed movie info:', error);
      }
    }

    function playMovie(id) {
      videoIframe.src = `https://vidsrc.xyz/embed/${currentType}/${id}`;
      videoContainer.style.display = 'block';
    }

    closeBtn.onclick = function() {
      modal.style.display = 'none';
      videoContainer.style.display = 'none';
      videoIframe.src = '';
    }

    signUpBtn.addEventListener('click', () => {
      signUpModal.style.display = 'block';
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    });

    signUpCloseBtn.onclick = function() {
      signUpModal.style.display = 'none';
    }

    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
        videoContainer.style.display = 'none';
        videoIframe.src = '';
      }
      if (event.target == signUpModal) {
        signUpModal.style.display = 'none';
      }
      if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
        searchResults.style.display = 'none';
      }
    }

    async function fetchItems() {
      if (isLoading) return;
      isLoading = true;
      loader.style.display = 'block';

      try {
        const response = await axios.get(`https://api.themoviedb.org/3/discover/${currentType}`, {
          params: {
            api_key: '15d2ea6d0dc1d476efbca3eba2b9bbfb',
            page: page,
            language: 'fr-FR',
            ...currentFilters
          }
        });

        const items = response.data.results;
        
        if (page === 1) {
          movieContainer.innerHTML = '';
          heroBackgrounds = items.slice(0, 5).map(item => item.backdrop_path);
          updateHeroBackground();
        }

        const row = document.createElement('div');
        row.className = 'row';
        
        items.forEach(item => {
          const card = createMovieCard(item);
          row.appendChild(card);
        });
        
        movieContainer.appendChild(row);
        createRowNavButtons(row);
        
        page++;
        isLoading = false;
        loader.style.display = 'none';
      } catch (error) {
        console.error('Error fetching items:', error);
        isLoading = false;
        loader.style.display = 'none';
      }
    }

    function updateHeroBackground() {
      hero.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${heroBackgrounds[currentHeroIndex]})`;
      currentHeroIndex = (currentHeroIndex + 1) % heroBackgrounds.length;
    }

    setInterval(updateHeroBackground, 3000);

    async function fetchGenres() {
      try {
        const response = await axios.get(`https://api.themoviedb.org/3/genre/${currentType}/list`, {
          params: {
            api_key: '15d2ea6d0dc1d476efbca3eba2b9bbfb'
          }
        });
        const genres = response.data.genres;
        genreFilter.innerHTML = '<option value="">Tous les Genres</option>';
        genres.forEach(genre => {
          const option = document.createElement('option');
          option.value = genre.id;
          option.textContent = genre.name;
          genreFilter.appendChild(option);
        });
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    }

    function populateYearFilter() {
      const currentYear = new Date().getFullYear();
      yearFilter.innerHTML = '<option value="">Toutes les Années</option>';
      for (let year = currentYear; year >= 1900; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
      }
    }

    async function fetchLanguages() {
      try {
        const response = await axios.get('https://api.themoviedb.org/3/configuration/languages', {
          params: {
            api_key: '15d2ea6d0dc1d476efbca3eba2b9bbfb'
          }
        });
        const languages = response.data;
        languageFilter.innerHTML = '<option value="">Toutes les Langues</option>';
        languages.forEach(language => {
          const option = document.createElement('option');
          option.value = language.iso_639_1;
          option.textContent = language.english_name;
          languageFilter.appendChild(option);
        });
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    }

    function handleFilterChange() {
      currentFilters.with_genres = genreFilter.value;
      currentFilters.year = yearFilter.value;
      currentFilters.with_original_language = languageFilter.value;
      currentFilters.sort_by = sortFilter.value;
      page = 1;
      fetchItems();
    }

    function handleScroll() {
      const scrollPosition = window.innerHeight + window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;

      if (scrollPosition >= scrollHeight - 500) {
        fetchItems();
      }
    }

    genreFilter.addEventListener('change', handleFilterChange);
    yearFilter.addEventListener('change', handleFilterChange);
    languageFilter.addEventListener('change', handleFilterChange);
    sortFilter.addEventListener('change', handleFilterChange);
    sortOrderFilter.addEventListener('change', () => {
      const [field, _] = sortFilter.value.split('.');
      currentFilters.sort_by = `${field}.${sortOrderFilter.value}`;
      page = 1;
      fetchItems();
    });

    browseOptions.forEach(option => {
      option.addEventListener('click', () => {
        browseOptions.forEach(btn => btn.classList.remove('active'));
        option.classList.add('active');
        currentType = option.dataset.type === 'all' ? 'movie' : option.dataset.type;
        page = 1;
        fetchGenres();
        fetchItems();
      });
    });

    window.addEventListener('scroll', handleScroll);

    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = searchInput.value.trim();
        if (query.length > 2) {
          console.log('Searching for:', query);
          searchItems(query);
        } else {
          searchResults.style.display = 'none';
        }
      }, 300);
    });

    async function searchItems(query) {
      try {
        console.log('Initiating search for:', query);
        const response = await axios.get('https://api.themoviedb.org/3/search/multi', {
          params: {
            api_key: '15d2ea6d0dc1d476efbca3eba2b9bbfb',
            query: query,
            page: 1,
            include_adult: false,
            language: 'fr-FR'
          }
        });

        const results = response.data.results.filter(item => 
          item.media_type !== 'person' && (item.backdrop_path || item.poster_path)
        ).slice(0, 5);

        console.log('Search results:', results);
        displaySearchResults(results);
      } catch (error) {
        console.error('Error searching items:', error);
      }
    }

    function displaySearchResults(results) {
      searchResults.innerHTML = '';
      if (results.length === 0) {
        searchResults.style.display = 'none';
        return;
      }

      results.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        
        const imagePath = item.poster_path || item.backdrop_path;
        resultItem.innerHTML = `
          <img src="https://image.tmdb.org/t/p/w92${imagePath}" 
               alt="${item.title || item.name}" 
               onerror="this.style.display='none'">
          <div>
            <div class="search-result-title">${item.title || item.name}</div>
            <div class="search-result-type">${item.media_type === 'tv' ? 'Série TV' : 'Film'}</div>
          </div>
        `;
        
        resultItem.addEventListener('click', () => {
          showMovieDetails(item);
          searchResults.style.display = 'none';
          searchInput.value = '';
        });
        
        searchResults.appendChild(resultItem);
      });

      searchResults.style.display = results.length > 0 ? 'block' : 'none';
    }

    function createRowNavButtons(row) {
      const navContainer = document.createElement('div');
      navContainer.className = 'row-nav';
      
      const leftBtn = document.createElement('button');
      leftBtn.innerHTML = '&#10094;';
      leftBtn.className = 'nav-btn left-btn';
      
      const rightBtn = document.createElement('button');
      rightBtn.innerHTML = '&#10095;';
      rightBtn.className = 'nav-btn right-btn';
      
      navContainer.appendChild(leftBtn);
      navContainer.appendChild(rightBtn);
      
      row.parentNode.insertBefore(navContainer, row.nextSibling);
      
      leftBtn.addEventListener('click', () => scrollRow(row, -4));
      rightBtn.addEventListener('click', () => scrollRow(row, 4));
    }

    function scrollRow(row, direction) {
      const scrollAmount = direction * (row.offsetWidth / 4);
      row.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }

    fetchGenres();
    populateYearFilter();
    fetchLanguages();
    fetchItems();