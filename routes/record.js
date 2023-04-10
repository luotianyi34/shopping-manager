const express = require('express');
const router = express.Router();
const connection = require("../util/db")
const result = require("../util/json")

router.get("/list", function (req, res) {
    res.render("record/record-list", {loginInfo: req.session.loginInfo});
})

router.get("/page", function (req, res) {
    const {query} = req;
    const params = [];
    const loginInfo = req.session.loginInfo;
    let sql = "select r.*,u.nickname uname,c.car_no car_no from record r left join userinfo u on r.record_id = u.id left join car c on r.car_id = c.id where 1 = 1 ";
    sql = setSqlParams(sql, query, params, loginInfo);
    sql += " order by r.id desc limit ?,?";
    params.push((query.page - 1) * query.limit);
    params.push(parseInt(query.limit));
    connection.query(sql, params, function (e, dList) {
        if (e) throw e;
        let countSql = "select count(r.id) count from record r left join userinfo u on r.record_id = u.id left join car c on r.car_id = c.id where 1 = 1 ";
        const countParams = [];
        countSql = setSqlParams(countSql, query, countParams, loginInfo);
        connection.query(countSql, countParams, function (e, r) {
            if (e) throw e;
            res.send(result.page(dList, r[0].count));
        });
    });
})

router.delete("/delete/:id", function (req, res) {
    connection.query("delete from record where id = ?", [req.params.id], function (e, r) {
        if (e) throw e;
        if (r.affectedRows === 1) {
            res.send(result.ok());
        } else {
            res.send(result.error("删除失败"));
        }
    })
});
router.get("/edit", function (req, res) {
    const {query} = req;
    if (query.id) {
        connection.query("select * from record where id = ?", query.id, function (e, r) {
            if (e) throw e;
            res.render("record/record-edit", {record: r[0], loginInfo: req.session.loginInfo})
        })
    } else {
        res.render("record/record-edit", {record: {}, loginInfo: req.session.loginInfo})
    }
})

router.post("/update", function (req, res) {
    const {body} = req;
    if (body.id) {
        let sql = "update record set record_time = ?,record_id = ?,record_type = ?,record_money = ?,content = ?,status = ?,car_id = ? where id = ?";
        const params = [body.record_time, body.record_id, body.record_type, body.record_money, body.content, body.status, body.car_id, body.id];
        connection.query(sql, params, function (e, r) {
            if (e) throw e;
            if (r.affectedRows === 1) {
                res.send(result.ok());
            } else {
                res.send(result.error("修改失败"));
            }
        });
    } else {
        let sql = "insert into record values(null,?,?,?,?,?,?,?)";
        const params = [body.record_time, req.session.loginInfo.id, body.record_type, body.record_money, body.content, body.status, body.car_id];
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

function setSqlParams(sql, query, params, loginInfo) {
    if (loginInfo.power == 1) {
        if (query.record_id) {
            sql += "and r.record_id = ? ";
            params.push(query.record_id);
        }
    } else {
        sql += "and r.record_id = ? ";
        params.push(loginInfo.id);
    }

    if (query.car_id) {
        sql += "and r.car_id = ? ";
        params.push(query.car_id);
    }
    if (query.status) {
        sql += "and r.status = ? ";
        params.push(query.status)
    }
    if (query.record_type) {
        sql += "and r.record_type = ? ";
        params.push(query.record_type)
    }
    if (query.record_time) {
        const times = query.record_time.split(" - ");
        sql += "and r.record_time between ? and ? ";
        params.push(times[0]);
        params.push(times[1]);
    }
    return sql;
}

module.exports = router;
