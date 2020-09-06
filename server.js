const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const Database = require("better-sqlite3");
const db = new Database("./ero-his-db.sqlite", { verbos: console.log });

const HTTP_PORT = 3000;

const jsonParser = bodyParser.json();

app.listen(HTTP_PORT, () => {
    console.log(`Server running on port $PORT`);
});

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", ["https://nhentai.net"]);
    res.header(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
    );
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Contral-Allow-Method", "GET, POST, UPDATE, PATCH");
    next();
});

// routers
app.get("/", (req, res) => {
    res.json({ message: "OK" });
});

//// check record exists
app.post("/check", jsonParser, (req, res) => {
    let ids = [];
    let st = {};
    const check = db.prepare("select id, state from history where id = ?");
    req.body.map((id) => {
        const isExists = check.get(id);
        if (isExists) {
            st[id] = isExists.state;
        }
    });

    res.json(st);
});

//// get articles
app.get("/get/articles/:site", (req, res) => {
    const sql = "select id, state from history where site = ?";
    db.all(sql, req.params.site, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message, data: req.params.site });
            return;
        }
        res.json({
            message: "success",
            data: rows,
        });
    });
});

//// get the article
app.get("/get/article/:id", (req, res, next) => {
    const sql = "select state from history where site = ?";
    db.get(sql, req.params.id, (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: row,
        });
    });
});

//// add new history
app.post("/add", jsonParser, (req, res, next) => {
    const ins = db.prepare(
        "INSERT INTO history (site, id, state, page, create_at, update_at) VALUES (@site, @id, @state, @page, @create_at, @update_at)"
    );

    const titleList = req.body;

    titleList.map((title) => {
        ins.run({
            site: title.site,
            id: title.id,
            state: title.state,
            page: title.page,
            create_at: title.create_at,
            update_at: title.update_at,
        });
    });
});

//// update history
app.post("/update", jsonParser, (req, res, next) => {
    const check = db
        .prepare("SELECT id from history where id = ?")
        .get(req.body.id);

    const upd = db.prepare(
        "UPDATE history set state = @state, update_at = @upda where id = @id"
    );

    const ins = db.prepare(
        "INSERT INTO history (site, id, state, page, create_at, update_at) VALUES (@site, @id, @state, @page, @create_at, @update_at)"
    );

    if (check) {
        upd.run({
            state: req.body.state,
            upda: req.body.update_at,
            id: req.body.id,
        });
    } else {
        ins.run({
            site: req.body.site,
            id: req.body.id,
            state: req.body.state,
            page: 0,
            create_at: req.body.create_at,
            update_at: req.body.update_at,
        });
    }

    res.json(req.body.state);
});
