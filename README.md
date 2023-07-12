# "Mimesweeper" - an interpretation of Minesweeper
This project reimplements the classic Windows game Minesweeper as "Mimesweeper".

## Rules
The game has the following rules:
1. Clicking a mine ends the game.
2. Clicking a square with an adjacent mine clears that square and shows the number of mines touching it. 
3. Clicking a square with no adjacent mine clears that square and clicks all adjacent squares.
4. This first click can never be a mine.
5. The numbers reflect the number of mines touching a square.
6. Right-clicking on a square puts a flag on it. The flagged square can’t be opened by a click.
7. If the number in a square is equal to the number of squares touching that square that are flagged, \
    double-clicking on the number opens up all remaining squares around the number. (Note: this won’t work on touch screen devices)

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
