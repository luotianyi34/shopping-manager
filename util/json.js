module.exports = {
    ok(data = null, msg = "success", code = 200) {
        return {
            code, msg, data
        }
    },
    error(msg = "error", code = 500) {
        return {code, msg}
    },
    page(data = [], count = 0, code = 0, msg = "暂无数据") {
        return {data, code, count, msg}
    }
}
