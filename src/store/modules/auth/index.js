import Cookies from 'js-cookie'
import axios from '@/util/ajax'
import Auth from '@/util/auth'

const state = {
    token: '',
    navList: []
}

const mutations = {
    setNavList: (state, data) => {
        state.navList = data
    },

    setToken: (state, data) => {
        if(data){
            Auth.setToken(data)
            Auth.setLoginStatus()
        } else {
            Auth.removeToken()
            Auth.removeLoginStatus()
        }
        state.token = data
    }
}

const actions = {
    // 邮箱登录
    loginByEmail({ commit }, userInfo) {
        return new Promise((resolve) => {
            axios({
                url: '/login',
                method: 'post',
                data: {
                    ...userInfo
                }
            }).then(res => {
                if(res.login){
                    commit('setToken', res.token)
                    // 假如需要在全局命名空间内分发action或提交mutation，将root: true作为第三参数传给dispatch或commit
                    commit('user/setName', res.name, { root: true })
                }
                resolve(res)
            })
        });
    },

    // 登出
    logout({commit}) {
        return new Promise((resolve) => {
            commit('setToken', '')
            // 假如需要在全局命名空间内分发action或提交mutation，将root: true作为第三参数传给dispatch或commit
            commit('user/setName', '', { root: true })
            commit('tagNav/removeTagNav', '', {root: true})
            resolve()
        })
    },

    // 重新获取用户信息及Token
    // TODO: 这里不需要提供用户名和密码，实际中请根据接口自行修改
    relogin({dispatch, commit, state}){
        return new Promise((resolve) => {
            // 根据Token进行重新登录
            let token = Cookies.get('token'),
                userName = Cookies.get('userName')

            // 重新登录时校验Token是否存在，若不存在则获取
            if(!token){
                dispatch("getNewToken").then(() => {
                    commit('setToken', state.token)
                })
            } else {
                commit('setToken', token)
            }
            // 刷新/关闭浏览器再进入时获取用户名
            // 假如需要在全局命名空间内分发action或提交mutation，将root: true作为第三参数传给dispatch或commit
            commit('user/setName', decodeURIComponent(userName), { root: true })
            resolve()
        })
    },

    // 获取新Token
    getNewToken({commit, state}){
        return new Promise((resolve) => {
            axios({
                url: '/getToken',
                method: 'get',
                param: {
                    token: state.token
                }
            }).then((res) =>{
                commit("setToken", res.token)
                resolve()
            })
        })
    },

    // 获取该用户的菜单列表
    getNavList({commit}){
        return new Promise((resolve) =>{
            axios({
                url: '/user/navlist',
                methods: 'post',
                data: {}
            }).then((res) => {
                commit("setNavList", res)
                resolve(res)
            })
        })
    },

    // 将菜单列表扁平化形成权限列表
    getPermissionList({state}){
        return new Promise((resolve) =>{
            let permissionList = []
            // 将菜单数据扁平化为一级
            function flatNavList(arr){
                for(let v of arr){
                    if(v.child && v.child.length){
                        flatNavList(v.child)
                    } else{
                        permissionList.push(v)
                    }
                }
            }
            flatNavList(state.navList)
            resolve(permissionList)
        })
    }
}

export default {
    // 如果开发者希望当前模块具有更高的封装性和复用性，可以通过添加namespace: true的方式，使其成为带命名空间的模块
    // 当模块注册后，其所有action和mutation都会自动根据模块注册的路径调整命名
    namespaced: true,
    state,
    mutations,
    actions
}