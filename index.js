var io = require("socket.io-client");
var Speaker = require("speaker");
var request = require("request");
var config = require("config");

var speaker;

var socket = io.connect("http://api.choona.net");

socket.on("unauthorized", function (error) {
  console.log("Authorization error:", error);
  if (error.name === "TokenExpiredError") {
    authenticate();
  }
});

socket.on("connect", function () {
  console.log("Connecting");
  authenticate();
});

socket.on("disconnect", function () {
  console.log("Disconnected");
  if (speaker) {
    speaker.end();
  }
});

socket.on("authenticated", function () {
  console.log("Authenticated");
  socket.emit("playlist:join", { playlistId: config.playlistId });
});

socket.on("playlist:init", function () {
  console.log("Playlist init received, requesting stream");
  speaker = new Speaker();
  socket.emit("playlist:stream:start");
});

socket.on("playlist:data", function (data) {
  speaker.write(data);
});

function authenticate() {
  console.log("Authenticating");
  request({
    url: "https://choona.eu.auth0.com/oauth/ro",
    form: {
      grant_type: "password",
      username: config.auth.username,
      password: config.auth.password,
      client_id: "ayp76kQ1YxZJfLnY7TUKRj5KdiHcHSAH",
      connection: "Username-Password-Authentication",
      scope: "openid"
    }
  }, function (err, res, body) {
    if (err) {
      throw err;
    }
    body = JSON.parse(body);
    console.log("Sending auth token:", body.id_token);
    socket.emit("authenticate", { token: body.id_token });
  });
}