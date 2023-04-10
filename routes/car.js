const express = require('express');
const router = express.Router();
const connection = require("../util/db")
const result = require("../util/json")

router.get("/list", function (req, res) {
    res.render("car/car-list");
})

router.get("/page", function (req, res) {
    const {query} = req;
    let sql = "select c.*,b.brand_name bname from car c left join brand b on c.brand_id = b.id where 1 = 1 ";
    const params = [];
    sql = setSqlParams(query, sql, params);
    sql += " order by c.id desc limit ?,?";
    params.push((query.page - 1) * query.limit);
    params.push(parseInt(query.limit));
    connection.query(sql, params, function (e, dataList) {
        if (e) throw e;
        let countSql = "select count(c.id) count from car c left join brand b on c.brand_id = b.id where 1 = 1 ";
        const countParams = [];
        countSql = setSqlParams(query, countSql, countParams);
        connection.query(countSql, countParams, function (e, r) {
            if (e) throw e;
            res.send(result.page(dataList, r[0].count));
        });
    });
})

router.delete("/delete/:id", function (req, res) {
    connection.query("delete from car where id = ? ", [req.params.id], function (e, r) {
        if (e) throw e;
        res.send(r.affectedRows === 1 ? result.ok() : result.error("删除失败!"))
    });
})

router.get("/edit", function (req, res) {
    const {query} = req;
    if (query.id) {
        connection.query("select * from car where id = ?", [query.id], function (e, r) {
            if (e) throw e;
            res.render("car/car-edit", {car: r[0]})
        });
    } else {
        res.render("car/car-edit", {car: {}})
    }
})
router.post("/save", function (req, res) {
    const {body} = req;
    connection.query("select * from car where car_no = ?", [body.car_no], function (e, r) {
        if (e) throw e;
        if (r.length > 0) {
            res.json(result.error("车牌号已存在！"));
        } else {
            let sql = "insert into car values (null,?,?,?,?,?,?,?,?)"
            const params = [body.car_no, body.color, body.brand_id, body.frame_number, body.driver_photo, body.car_status, body.mileage, body.status];
            connection.query(sql, params, function (e, r) {
                if (e) throw e;
                if (r.affectedRows === 1) {
                    /*获取车辆的照片数组*/
                    let carImage = body.car_image;
                    if (carImage) {
                        carImage = carImage.split(",");
                        if (carImage.length > 0) {
                            const car_id = r.insertId;
                            let ciSql = "insert into car_image values";
                            const ciParams = [];
                            for (const ci of carImage) {
                                ciSql += "(null,?,?),";
                                ciParams.push(ci)
                                ciParams.push(car_id);
                            }
                            ciSql = ciSql.substring(0, ciSql.length - 1);
                            connection.query(ciSql, ciParams, function (e, r) {
                                if (e) throw e;
                                if (r.affectedRows === carImage.length) {
                                    res.json(result.ok());
                                } else {
                                    res.json(result.error("图片保存异常"));
                                }
                            })
                        }
                    } else {
                        res.json(result.ok());
                    }

                } else {
                    res.json(result.error("添加失败"))
                }
            });
        }
    })
})

router.post("/update", function (req, res) {
    const {body} = req;
    let sql = "update car set car_no = ?, color = ?, brand_id = ?, frame_number = ?, driver_photo = ?,car_status = ?, mileage = ?, status = ? where id = ?";
    const params = [body.car_no, body.color, body.brand_id, body.frame_number, body.driver_photo, body.car_status, body.mileage, body.status, body.id];
    connection.query(sql, params, function (e, r) {
        if (e) throw e;
        if (r.affectedRows === 1) {
            connection.query("delete from car_image where car_id = ?", body.id, function (e, r) {
                if (e) throw e;
                /*获取车辆的照片数组*/
                let carImage = body.car_image;
                if (carImage) {
                    carImage = carImage.split(",");
                    if (carImage.length > 0) {
                        const car_id = body.id;
                        let ciSql = "insert into car_image values";
                        const ciParams = [];
                        for (const ci of carImage) {
                            ciSql += "(null,?,?),";
                            ciParams.push(ci)
                            ciParams.push(car_id);
                        }
                        ciSql = ciSql.substring(0, ciSql.length - 1);
                        connection.query(ciSql, ciParams, function (e, r) {
                            if (e) throw e;
                            if (r.affectedRows === carImage.length) {
                                res.json(result.ok());
                            } else {
                                res.json(result.error("图片保存异常"));
                            }
                        })
                    }
                } else {
                    res.json(result.ok());
                }
            });
        } else {
            res.json(result.error("修改失败"))
        }
    });
})

router.get('/image/:id', function (req, res) {
    const id = req.params.id;
    connection.query("select * from car_image where car_id = ?", id, function (e, r) {
        if (e) throw e;
        res.json(result.ok(r));
    })
})

router.get('/select', function (req, res) {
    connection.query("select * from car order by id desc", function (e, r) {
        if (e) throw e;
        res.json(result.ok(r))
    });
})

function setSqlParams(query, sql, params) {
    if (query.car_no) {
        sql += " and c.car_no = ? ";
        params.push(query.car_no);
    }
    if (query.color) {
        sql += "and c.color like ? ";
        params.push(`%${query.color}%`);
    }
    if (query.frame_number) {
        sql += "and c.frame_number = ? ";
        params.push(query.frame_number);
    }
    if (query.brand_id) {
        sql += "and c.brand_id = ? ";
        params.push(query.brand_id);
    }
    if (query.car_status) {
        sql += "and c.car_status = ? ";
        params.push(query.car_status);
    }
    if (query.status) {
        sql += "and c.status = ? ";
        params.push(query.status);
    }
    return sql;
}

module.exports = router;
