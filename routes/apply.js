const express = require('express');
const router = express.Router();
const connection = require("../util/db")
const result = require("../util/json")

router.get('/list', function (req, res) {
    res.render('apply/apply-list', {loginInfo: req.session.loginInfo})
})

router.get('/exam', function (req, res) {
    res.render('apply/apply-exam', {loginInfo: req.session.loginInfo})
})

router.get('/edit', function (req, res) {
    const id = req.query.id;
    const type = req.query.type;
    if (id) {
        connection.query("select a.*,u.nickname apply_name,c.car_no,d.nickname driver_name,dep.name dep_name,f.nickname fname,g.nickname gname,cc.car_no z_car_no,dd.nickname z_driver_name from applyinfo a  left join userinfo u on a.apply_id = u.id left join car c on a.apply_car_id = c.id left join department dep on u.department_id = dep.id left join userinfo d on a.apply_driver_id = d.id left join userinfo f on a.exam_did = f.id left join userinfo g on a.exam_aid = g.id left join car cc on a.car_id = cc.id left join userinfo dd on a.driver_id = dd.id where a.id = ?", id, function (e, r) {
            if (e) throw e;
            res.render('apply/apply-edit', {apply: r[0], type, loginInfo: req.session.loginInfo});
        });
    } else {
        res.render('apply/apply-edit', {apply: {}, type, loginInfo: req.session.loginInfo});
    }
})

router.post('/update', function (req, res) {
    const body = req.body;
    let sql = "";
    let params = [];
    if (body.id) {
        sql = "update applyinfo set apply_content=?,apply_car_id=?,apply_driver_id=?,is_driver=?,start_time=?,end_time=? where id = ?";
        params = [body.apply_content, body.apply_car_id || null, body.apply_driver_id || null, body.is_driver, body.start_time, body.end_time, body.id];
    } else {
        sql = "insert into applyinfo(apply_id,apply_time,apply_content,apply_car_id,apply_driver_id,is_driver,start_time,end_time,exam_status,exam_did,exam_dtime,exam_dcontent) values (?,?,?,?,?,?,?,?,?,?,?,?)";
        let exam_status = 10;
        let exam_did = null;
        let exam_dtime = null;
        let exam_dcontent = null;
        if (req.session.loginInfo.power == 2) {
            exam_status = 20;
            exam_did = req.session.loginInfo.id;
            exam_dtime = new Date();
            exam_dcontent = "同意";
        }
        params = [req.session.loginInfo.id, new Date(), body.apply_content, body.apply_car_id || null, body.apply_driver_id || null, body.is_driver, body.start_time, body.end_time, exam_status, exam_did, exam_dtime, exam_dcontent];
    }
    connection.query(sql, params, function (e, r) {
        if (e) throw e;
        if (r.affectedRows > 0) {
            res.json(result.ok())
        } else {
            res.json(result.error(`${body.id ? "修改" : "添加"}失败`));
        }
    })
})


router.get('/page', function (req, res) {
    const loginInfo = req.session.loginInfo;
    const query = req.query;
    const params = [];
    let sql = "select a.*,u.nickname apply_name,c.car_no,d.nickname driver_name,dep.name dep_name,f.nickname fname,g.nickname gname,cc.car_no z_car_no,dd.nickname z_driver_name from applyinfo a  left join userinfo u on a.apply_id = u.id left join car c on a.apply_car_id = c.id left join department dep on u.department_id = dep.id left join userinfo d on a.apply_driver_id = d.id left join userinfo f on a.exam_did = f.id left join userinfo g on a.exam_aid = g.id left join car cc on a.car_id = cc.id left join userinfo dd on a.driver_id = dd.id where 1 = 1 ";
    sql = setSqlParams(loginInfo, sql, params, query);
    sql += " order by a.exam_dtime,a.exam_atime desc limit ?,?";
    params.push((query.page - 1) * query.limit);
    params.push(parseInt(query.limit));

    connection.query(sql, params, function (e, applyList) {
        if (e) throw e;
        let countSql = "select count(a.id) count from applyinfo a  left join userinfo u on a.apply_id = u.id left join car c on a.apply_car_id = c.id left join department dep on u.department_id = dep.id left join userinfo d on a.apply_driver_id = d.id left join userinfo f on a.exam_did = f.id left join userinfo g on a.exam_aid = g.id left join car cc on a.car_id = cc.id left join userinfo dd on a.driver_id = dd.id where 1 = 1 ";
        const countParams = [];
        countSql = setSqlParams(loginInfo, countSql, countParams, query);
        connection.query(countSql, countParams, function (e, r) {
            if (e) throw e;
            res.json(result.page(applyList, r[0].count));
        })
    })
})

router.delete("/delete/:id", function (req, res) {
    /*取消前先查询该记录的状态*/
    connection.query("select * from applyinfo where id = ?", req.params.id, function (e, [apply]) {
        if (apply) {
            let flag = false;
            if (req.session.loginInfo.power == 2) {
                flag = apply.exam_status == 20;
            } else if (req.session.loginInfo.power == 3) {
                flag = apply.exam_status == 10;
            } else {
                res.json(result.error("您没有取消申请的权限"));
            }
            if (flag) {
                connection.query("update applyinfo set exam_status = 11 where id = ?", req.params.id, function (e, r) {
                    if (r.affectedRows > 0) {
                        res.json(result.ok())
                    } else {
                        res.json(result.error("取消异常"))
                    }
                })
            } else {
                res.json(result.error("申请已审核，无法取消"))
            }
        } else {
            res.json(result.error("要取消的申请不存在"));
        }
    })
})

router.post('/dep/exam', function (req, res) {
    let sql = "update applyinfo set exam_did = ?,exam_dcontent = ?,exam_dtime = ?,exam_status = ? where id = ?";
    const params = [req.session.loginInfo.id, req.body.exam_dcontent, new Date(), req.body.exam_status, req.body.id];
    connection.query(sql, params, function (e, r) {
        if (r.affectedRows > 0) {
            res.json(result.ok())
        } else {
            res.json(result.error(`操作失败`));
        }
    });
})

router.post('/admin/exam', function (req, res) {
    let sql = "update applyinfo set exam_aid = ?,exam_acontent = ?,exam_atime = ?,exam_status = ?,car_id = ?,driver_id = ? where id = ?";
    const params = [req.session.loginInfo.id, req.body.exam_acontent, new Date(), req.body.exam_status, req.body.car_id || null, req.body.driver_id || null, req.body.id];
    connection.query(sql, params, function (e, r) {
        if (r.affectedRows > 0) {
            res.json(result.ok());
        } else {
            res.json(result.error(`操作失败`));
        }
    });
})

router.post('/back/:id', function (req, res) {
    const {id} = req.params;
    connection.query("update applyinfo set exam_status = 40 where id = ?", id, function (e) {
        if (e) throw e;
        res.json(result.ok());
    })
})

router.get('/free', function (req, res) {
    const {start_time, end_time} = req.query;
    const sql = "select * from applyinfo where exam_status = 30 and ((start_time < ? and end_time > ?) or (start_time > ? and start_time < ?) or (end_time > ? and end_time < ?))";
    const params = [start_time, end_time, start_time, end_time, start_time, end_time];
    connection.query(sql, params, function (e, r) {
        if (e) throw e;
        res.json(result.ok(r));
    })
})

function setSqlParams(loginInfo, sql, params, query) {
    if (loginInfo.power == 2) {
        sql += "and u.department_id = (select depa.id from department depa left join userinfo us on depa.id = us.department_id where us.id = ? ) ";
        params.push(loginInfo.id);
    }
    if (loginInfo.power == 3) {
        sql += "and a.apply_id = ? ";
        params.push(loginInfo.id);
    }
    if (query.driver_id) {
        sql += " and (a.driver_id = ? or a.apply_driver_id = ?) ";
        params.push(query.driver_id);
        params.push(query.driver_id);
    }
    if (query.car_id) {
        sql += " and (a.car_id = ? or a.apply_car_id = ?) ";
        params.push(query.car_id);
        params.push(query.car_id);
    }
    if (query.apply_id) {
        sql += " and a.apply_id = ? ";
        params.push(query.apply_id);
    }
    if (query.exam_status) {
        sql += "and a.exam_status = ? ";
        params.push(query.exam_status);
    }
    return sql;
}

module.exports = router;
