# Cat Slideshow

### Try the app

[Click here](https://jon-whiteroomsoftware.github.io/cat-slideshow/)

### Functionality/Features

- Select a breed to show photos of only that breed, or "All Breeds"
- Use next and previous arrows to scroll through photos
  - Arrows disable at beginning and end of photo data
- Prefetch photo data and images in the background
  - Fetch eagerly from CatAPI in the background to minimize load times
  - Abort in-flight HTTP requests when switching breeds or when component is unmounted
  - Don't show photos until they have been preloaded
  - Show a loading spinner when the API or image loading backs up
- Animate next and previous photos with simple slide animation
- Persist selected breed in local storage

### ToDo - CR feedback + new features

- usePrefetchImages - imageLoadMap to Map?
- ErrorBoundary + states for API failures
- set colors using css variables
- Tests

### Navigating the code

- Cat App
  - BreedSelector
    - useAbortableFetch
  - CatSlideshow
    - MessageCard
    - LoadingCard
    - CatSlideshowControls
    - SlideAnimation
    - usePaginatedFetch
      - useAbortableFetch
        - useAsync
