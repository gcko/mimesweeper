# "Mimesweeper" - an interpretation of Minesweeper
This project reimplements the classic Windows game Minesweeper as "Mimesweeper".

![](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoidWVmUGxlaDA5WW9INTIrcWJVTlNzdjUrNDVBc2JGTUplRW8zTVpTd3NBaS9EcURRMmsrcXVCNHBseVMxeE92VUpOV2VXNXZVdjNTQ3lsODlLbS8zbVRvPSIsIml2UGFyYW1ldGVyU3BlYyI6IkN1SkpaaXJwMFVpdHRtZk0iLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=main)

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

## Quick start

### Traditional Method
This project uses Node >= 20, this is strictly enforced. you can run Node 20 in a sub environment 
using [Nave](https://github.com/isaacs/nave) or [NVM](https://github.com/nvm-sh/nvm)

From the project root directory, run the following:
```shell
# only if you use nave
nave auto
```

```shell
npm install
```

### Container Method
This project can be spun up within Docker. Simply run:
**NOTE:** For Apple Silicon Mac, the [platform parameters](https://stackoverflow.com/questions/65612411/forcing-docker-to-use-linux-amd64-platform-by-default-on-macos) currently do not work.

```shell
docker compose up
```

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
