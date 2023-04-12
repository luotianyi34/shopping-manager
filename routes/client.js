const express = require('express');
const router = express.Router();
const connection = require("../util/db")
const result = require("../util/json")

router.get("/list", function (req, res) {
    res.render("client/client-list",{loginInfo: req.session.loginInfo});
})

router.get("/page", function (req, res) {
    const {query} = req;
    let sql = "select c.* from client c where 1 = 1 ";
    const params = [];
    sql = setSqlParams(query, sql, params);
    sql += " order by c.id limit ?,? ";
    params.push((query.page - 1) * query.limit);
    params.push(parseInt(query.limit));
    connection.query(sql, params, function (e, dataList) {
        if (e) throw e;
        let countSql = "select count(c.id) count from client c where 1 = 1 ";
        const countParams = [];
        countSql = setSqlParams(query, countSql, countParams);
        connection.query(countSql, countParams, function (e, r) {
            if (e) throw e;
            res.send(result.page(dataList, r[0].count));
        });
    });
})

router.delete("/delete/:id", function (req, res) {
    connection.query("delete from client where id = ? ", [req.params.id], function (e, r) {
        if (e) throw e;
        res.send(r.affectedRows === 1 ? result.ok() : result.error("删除失败!"))
    });
});

router.get("/edit", function (req, res) {
    const {query} = req;
    if (query.id) {
        connection.query("select * from client where id = ?", query.id, function (e, r) {
            if (e) throw e;
            res.render("client/client-edit", {shop: r[0]})
        })
    } else {
        res.render("client/client-edit", {shop: {}})
    }
})
router.post("/update", function (req, res) {
    const {body} = req;
    if (body.id) {
        let sql = "update client set name = ?, address = ?,tel = ?,sex=? where id = ?";
        const params = [body.name, body.address, body.tel,body.sex, body.id];
        connection.query(sql, params, function (e, r) {
            if (e) throw e;
            if (r.affectedRows === 1) {
                res.send(result.ok());
            } else {
                res.send(result.error("修改失败"));
            }
        });
    } else {
        let sql = "insert into client values(null,?,?,?,?)";
        const params = [body.name, body.address, body.tel,body.sex];
        connection.query(sql, params, function (e, r) {
            if (e) throw e;
            if (r.affectedRows === 1) {
                res.send(result.ok());
            } else {
                res.send(result.error("添加失败"));
            }
        });
    }
})

router.get("/select", function (req, res) {
    const {query} = req;
    let sql = "select * from client c where 1 = 1 ";
    const params = [];
    if (query.name) {
        sql += "where name = ? ";
        params.push(query.name)
    }
    sql += "order by id desc";
    connection.query(sql, params, function (e, dList) {
        if (e) throw e;
        res.send(result.ok(dList));
    });
})

function setSqlParams(query, sql, params) {
    if (query.name) {
        sql += "and c.name = ? ";
        params.push(query.name);
    }
    if (query.address) {
        sql += "and address = ? ";
        params.push(query.address);
    }
    if (query.tel) {
        sql += "and tel = ? ";
        params.push(query.tel);
    }
    if (query.sex) {
        sql += "and sex = ? ";
        params.push(query.sex);
    }
    return sql;
}

module.exports = router;