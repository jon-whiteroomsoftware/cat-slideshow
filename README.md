# Cat Slideshow

### Try the app

[Click here](https://jon-whiteroomsoftware.github.io/cat-slideshow/)

### Code review - what I'm looking for

1. I've mostly been focussed on making sure I truly understand the standard hooks and how to abstract out reusable custom hooks.
1. I also wanted to ensure that I was keep an eye on good performance habits by keeping the number of renders to a minimum.
1. I'd like to hear any and all feedback you have, from problems with abstraction, hooks etc. all the way down to the nittiest of nits.
1. It would also be great to hear your advice on better ways to do things or missing features of Hooks I could be using.
1. While this obviously isn't production code, I'm trying to treat it as such.
1. I'm happy to get your feedback in any form that works for you - github code review, email, or verbal feedback.
1. Thanks for reviewing my code! You rock.

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

- always render catslideshow controls from catslideshow
- remove useEffect dependency entirely for selectedBreedID ref in CatSlideshow
- config via context?
- ErrorBoundary + states for API failures
- Typescript
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
