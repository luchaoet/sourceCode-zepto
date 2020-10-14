/* Zepto v1.1.6 - zepto event ajax form ie - zeptojs.com/license */

var Zepto = (function () {
  var undefined,
    key,
    $,
    classList,
    emptyArray = [],
    // 保存数组 slice filter 方法
    slice = emptyArray.slice,
    filter = emptyArray.filter,
    document = window.document,
    elementDisplay = {},
    classCache = {},
    // 属性值为数字的css属性
    cssNumber = {
      'column-count': 1,
      columns: 1,
      'font-weight': 1,
      'line-height': 1,
      opacity: 1,
      'z-index': 1,
      zoom: 1,
    },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,
    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
    adjacencyOperators = ['after', 'prepend', 'before', 'append'],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      tr: document.createElement('tbody'),
      tbody: table,
      thead: table,
      tfoot: table,
      td: tableRow,
      th: tableRow,
      '*': document.createElement('div'),
    },
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize,
    uniq,
    tempParent = document.createElement('div'),
    propMap = {
      tabindex: 'tabIndex',
      readonly: 'readOnly',
      for: 'htmlFor',
      class: 'className',
      maxlength: 'maxLength',
      cellspacing: 'cellSpacing',
      cellpadding: 'cellPadding',
      rowspan: 'rowSpan',
      colspan: 'colSpan',
      usemap: 'useMap',
      frameborder: 'frameBorder',
      contenteditable: 'contentEditable',
    },
    // 是否为数组
    isArray =
      Array.isArray ||
      function (object) {
        return object instanceof Array
      }

  zepto.matches = function (element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)

    // fall back to performing a selector:
    var match,
      parent = element.parentNode,
      temp = !parent

    // 没有父元素 创建一个div当作父元素
    if (temp) {
      parent = tempParent
      parent.appendChild(element)
      // 什么鬼写法
      // (parent = tempParent).appendChild(element)
    }
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    // null undefined boolean number string function array date regexp object error
    // 其他的都返回 object 例如：DOM对象
    // 判断是否为普通的对象 使用 $.isPlainObject
    return obj == null ? String(obj) : class2type[toString.call(obj)] || 'object'
  }

  function isFunction(value) {
    return type(value) == 'function'
  }
  // window 特性 window == window.window
  function isWindow(obj) {
    return obj != null && obj == obj.window
  }

  /**
   * 文档节点（document）：9，对应常量Node.DOCUMENT_NODE
   * 元素节点（element）：1， 对应常量Node.ELEMENT_NODE
   * 属性节点（attr）：2，    对应常量Node.ATTRIBUTE_NODE
   * 文本节点（text）：3，    对应常量Node.TEXT_NODE
   * 文档片断节点（DocumentFragment）：11， 对应常量Node.DOCUMENT_FRAGMENT_NODE
   * 文档类型节点（DocumentType）：10，     对应常量Node.DOCUMENT_TYPE_NODE
   * 注释节点（Comment）：8，               对应常量Node.COMMENT_NODE
   */
  // 该节点是否为根节点
  function isDocument(obj) {
    return obj != null && obj.nodeType == obj.DOCUMENT_NODE
  }
  function isObject(obj) {
    return type(obj) == 'object'
  }

  /**
   * 是否为普通对象
   * {} 或 new Object()
   */
  function isPlainObject(obj) {
    // Object.getPrototypeOf(obj) 返回指定对象的原型
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }

  // 数组或者对象数组
  function likeArray(obj) {
    return typeof obj.length == 'number'
  }

  // 过滤掉数组中的 null 值
  function compact(array) {
    return filter.call(array, function (item) {
      return item != null
    })
  }

  function flatten(array) {
    return array.length > 0 ? $.fn.concat.apply([], array) : array
  }

  camelize = function (str) {
    return str.replace(/-+(.)?/g, function (match, chr) {
      // - 后的字母大写
      return chr ? chr.toUpperCase() : ''
    })
  }
  function dasherize(str) {
    return str
      .replace(/::/g, '/')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .replace(/_/g, '-')
      .toLowerCase()
  }

  // 数组去重
  uniq = function (array) {
    return filter.call(array, function (item, idx) {
      return array.indexOf(item) == idx
    })
  }

  function classRE(name) {
    return name in classCache ? classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  // 处理可能需要带 px 的属性值
  function maybeAddPx(name, value) {
    // 属性值为数字 并且属性不为带数字的属性加上 px
    return typeof value == 'number' && !cssNumber[dasherize(name)] ? value + 'px' : value
  }

  // 获取元素的默认 display 值
  // show() 方法需要将display属性恢复为默认值
  function defaultDisplay(nodeName) {
    var element, display
    // 前文定义 elementDisplay = {}
    // 不存在则通过创建该元素从而获取该元素的display默认值
    if (!elementDisplay[nodeName]) {
      // 创建该元素 插入body中
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue('display')
      // 已获取删除该元素
      element.parentNode.removeChild(element)
      // 如果为 none 则可能是css样式中将其设置为none, 对结果有干扰，设为默认值 block
      display == 'none' && (display = 'block')
      // 将元素的display默认值存起来
      elementDisplay[nodeName] = display
    }
    // 存在则直接返回
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element
      ? slice.call(element.children)
      : $.map(element.childNodes, function (node) {
          if (node.nodeType == 1) return node
        })
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function (html, name, properties) {
    var dom, nodes, container

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, '<$1></$2>')
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function () {
        container.removeChild(this)
      })
    }

    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function (key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function (dom, selector) {
    dom = dom || []
    dom.__proto__ = $.fn
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function (object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function (selector, context) {
    var dom
    // 没有参数则返回空的Zepto集合
    if (!selector) return zepto.Z()
    // 参数为字符串
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector)) (dom = zepto.fragment(selector, RegExp.$1, context)), (selector = null)
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // 参数为方法时，DOM渲染完毕后执行
    else if (isFunction(selector)) return $(document).ready(selector)
    // Zepto 对象直接返回
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      else if (isObject(selector)) (dom = [selector]), (selector = null)
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector)) (dom = zepto.fragment(selector.trim(), RegExp.$1, context)), (selector = null)
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function (selector, context) {
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key])) target[key] = {}
        if (isArray(source[key]) && !isArray(target[key])) target[key] = []
        extend(target[key], source[key], deep)
      } else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function (target) {
    // target 第一个参数
    // args 剩余参数
    // arguments 所有的参数
    var deep,
      args = slice.call(arguments, 1)

    // target 为 true 时，target被重新赋值，第一个参数不会被操作修改，即深复制
    // 否则后面 target 被操作修改，即浅复制
    if (typeof target == 'boolean') {
      deep = target
      // 第一个参数为 true 将第二个参数复制给 target
      target = args.shift()
    }
    // 将 args 中的所有参数的属性复制到 target 中，target 若为第一个参数，则为浅复制的效果
    args.forEach(function (arg) {
      extend(target, arg, deep)
    })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  zepto.qsa = function (element, selector) {
    var found,
      // 是否为id选择器
      maybeID = selector[0] == '#',
      // 是否为class选择器
      maybeClass = !maybeID && selector[0] == '.',
      // id class选择器 截取出名称
      nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
      isSimple = simpleSelectorRE.test(nameOnly)
    return isDocument(element) && isSimple && maybeID
      ? (found = element.getElementById(nameOnly))
        ? [found]
        : []
      : element.nodeType !== 1 && element.nodeType !== 9 // 非element元素节点 非document文档节点
      ? []
      : slice.call(
          isSimple && !maybeID
            ? maybeClass
              ? element.getElementsByClassName(nameOnly) // If it's simple, it could be a class
              : element.getElementsByTagName(selector) // Or a tag
            : element.querySelectorAll(selector) // Or it's not simple, and we need to query all
        )
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  /**
   * contains 包含
   * 检查父元素是否包含某子元素
   */
  $.contains = document.documentElement.contains
    ? function (parent, node) {
        // 使用contains方法判断
        return parent !== node && parent.contains(node)
      }
    : function (parent, node) {
        // 一层一层的使用node的祖先节点与parent比较
        while (node && (node = node.parentNode)) if (node === parent) return true
        return false
      }

  // 传入字符串时返回字符串，传入函数时，根据传入的函数返回结果
  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  // 设置或删除节点属性
  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  // 设置或获取元素类名
  function className(node, value) {
    var klass = node.className || '',
      svg = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ? value == 'true' || (value == 'false' ? false : value == 'null' ? null : +value + '' == value ? +value : /^[\[\{]/.test(value) ? $.parseJSON(value) : value) : value
    } catch (e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.isEmptyObject = function (obj) {
    var name
    for (name in obj) return false
    return true
  }

  // v1.2+ 该版本无该方法 是否为数字或数字字符串
  $.isNumeric = function (val) {
    var num = Number(val),
      type = typeof val
    return (
      (val != null && // 非 null
        type != 'boolean' && // 非 boolean
        (type != 'string' || val.length) && // 非数组
        !isNaN(num) && // 非字符串 非对象
        isFinite(num)) || // 有限数字，NaN、正负无穷大则返回false
      false
    )
  }

  // 元素是否存在数组中，返回索引值，如果没有找到该元素则返回 -1
  $.inArray = function (elem, array, i) {
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize

  // 去除字符串头尾的空格部分
  $.trim = function (str) {
    // undefined == null => true 即 null/undefined返回 ''
    // 其他类型则被String()处理
    return str == null ? '' : String.prototype.trim.call(str)
  }

  // plugin compatibility
  $.uuid = 0
  $.support = {}
  $.expr = {}
  // v1.2+ 该版本无该方法 返回一个空函数
  $.noop = function () {}

  $.map = function (elements, callback) {
    var value,
      values = [],
      i,
      key
    // 数组或对象数组
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function (elements, callback) {
    var i, key
    // 数组或对象数组
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        // this 指向当前元素 返回 i 及当前元素
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      // 对象
      for (key in elements) if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  $.grep = function (elements, callback) {
    // [].filter 直接使用数组的 filter 方法
    return filter.call(elements, callback)
  }

  // 对象字符串转为对象 使用原生的 JSON.parse
  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each('Boolean Number String Function Array Date RegExp Object Error'.split(' '), function (i, name) {
    class2type['[object ' + name + ']'] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  // zepto 集合，定义所有可被使用的方法
  // 可以通过 $.fn.xxx = function() {} 的方式添加方法，所有Zepto对象都能使用该方法
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    // 与 each 类似， each返回false时，遍历停止
    forEach: emptyArray.forEach,

    /**
     * 遍历集合
     * reduce(function(memo, item, index, array){}
     * memo 函数上一次的返回值
     */
    reduce: emptyArray.reduce,

    // zepto集合中添加元素
    push: emptyArray.push,
    sort: emptyArray.sort,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function (fn) {
      return $(
        $.map(this, function (el, i) {
          return fn.call(el, i, el)
        })
      )
    },

    // 提取集合的子集元素
    slice: function () {
      return $(slice.apply(this, arguments))
    },

    ready: function (callback) {
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) {
        callback($)
      } else {
        /**
         * 当初始的 HTML 文档被完全加载和解析完成之后，DOMContentLoaded 事件被触发
         * 无需等待样式表、图像和子框架的完全加载
         */
        document.addEventListener(
          'DOMContentLoaded',
          function () {
            callback($)
          },
          false
        )
      }
      return this
    },

    /**
     * 返回集合中指定位置的元素
     * 不传参 返回DOM集合
     * 参数可为负数
     */
    get: function (idx) {
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },

    // 将zepto集合转为DOM数组
    toArray: function () {
      return this.get()
    },

    // 返回对象集合中的元素个数
    size: function () {
      return this.length
    },

    // 从dom节点中删除当前集合中的元素
    remove: function () {
      return this.each(function () {
        // 父节点删除当前元素
        // document.parentNode 为 null
        if (this.parentNode != null) this.parentNode.removeChild(this)
      })
    },

    // 遍历 返回false则结束遍历
    each: function (callback) {
      emptyArray.every.call(this, function (el, idx) {
        return callback.call(el, idx, el) !== false
      })
      return this
    },

    filter: function (selector) {
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(
        filter.call(this, function (element) {
          return zepto.matches(element, selector)
        })
      )
    },

    // 继续向dom数组中添加元素
    add: function (selector, context) {
      return $(uniq(this.concat($(selector, context))))
    },

    // 判断元素或当前集合中的第一个元素是否符合css选择器
    is: function (selector) {
      return this.length > 0 && zepto.matches(this[0], selector)
    },

    not: function (selector) {
      var nodes = []
      // 参数为函数
      if (isFunction(selector) && selector.call !== undefined) {
        /**
         * 擅自传入 el 值
         * 便于 not 以及 filter 函数中快速获取到当前元素，而不仅仅拿到当前的索引
         */
        this.each(function (idx, el) {
          if (!selector.call(this, idx, el)) nodes.push(this)
        })
      } else {
        var excludes =
          typeof selector == 'string'
            ? this.filter(selector) // 先用filter处理
            : likeArray(selector) && isFunction(selector.item)
            ? slice.call(selector) // 如果是类数组则转为数组
            : $(selector)
        // 数组元素取反
        this.forEach(function (el) {
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },

    // 返回集合的子元素中符合条件的元素
    has: function (selector) {
      return this.filter(function () {
        return isObject(selector) ? $.contains(this, selector) : $(this).find(selector).size()
      })
    },

    /**
     * 获取索引值对应的元素
     * -1 返回最后一个 slice不改变原数组
     * +idx + 1 ？？？
     */
    eq: function (idx) {
      return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1)
    },

    // 返回集合中的第一个元素
    first: function () {
      var el = this[0]
      // 保证返回的是Zepto对象 便于链式操作
      return el && !isObject(el) ? el : $(el)
    },

    // 返回集合中的最后一个元素 保证返回的是zepto对象
    last: function () {
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },

    // 在当对象前集合内查找符合CSS选择器的所有后代元素
    find: function (selector) {
      var result,
        $this = this
      // 返回 zepto 空集合
      if (!selector) {
        result = $()
      }
      // 参数为 zepto 对象
      else if (typeof selector == 'object') {
        result = $(selector).filter(function () {
          var node = this
          // some 其中一个满足条件则返回 true
          return emptyArray.some.call($this, function (parent) {
            return $.contains(parent, node)
          })
        })
      } else if (this.length == 1) {
        // $('form').find('input')
        result = $(zepto.qsa(this[0], selector))
      } else {
        result = this.map(function () {
          return zepto.qsa(this, selector)
        })
      }
      return result
    },
    closest: function (selector, context) {
      var node = this[0],
        collection = false
      if (typeof selector == 'object') collection = $(selector)
      while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector))) node = node !== context && !isDocument(node) && node.parentNode
      return $(node)
    },

    // 获取元素的所有祖先元素
    parents: function (selector) {
      var ancestors = [],
        nodes = this
      while (nodes.length > 0) {
        // 获取元素的父元素
        nodes = $.map(nodes, function (node) {
          if (
            // node赋值为父元素
            (node = node.parentNode) &&
            // 不为根节点
            !isDocument(node) &&
            // 判重 防止与其他元素的父元素重复
            ancestors.indexOf(node) < 0
          ) {
            ancestors.push(node)
            return node
          }
        })
      }
      // 过滤
      return filtered(ancestors, selector)
    },

    // 获取元素的直接父元素
    parent: function (selector) {
      return filtered(uniq(this.pluck('parentNode')), selector)
    },

    children: function (selector) {
      return filtered(
        this.map(function () {
          return children(this)
        }),
        selector
      )
    },

    // 获得集合元素的子元素，包括文字和注释节点
    contents: function () {
      return this.map(function () {
        // 类数组转数组
        return slice.call(this.childNodes)
      })
    },

    // 获取元素的所有兄弟节点
    siblings: function (selector) {
      return filtered(
        this.map(function (i, el) {
          return filter.call(children(el.parentNode), function (child) {
            // 排除当前元素
            return child !== el
          })
        }),
        selector
      )
    },

    // 清空元素中的dom内容
    empty: function () {
      return this.each(function () {
        this.innerHTML = ''
      })
    },

    // 获取集合中每个元素的属性值
    // `pluck` is borrowed from Prototype.js
    pluck: function (property) {
      return $.map(this, function (el) {
        return el[property]
      })
    },

    // 使元素显示 去除 display=none
    show: function () {
      return this.each(function () {
        // 处理内联样式 this.style.display 只能获取内联样式的值
        this.style.display == 'none' && (this.style.display = '')
        // 处理css样式
        if (getComputedStyle(this, '').getPropertyValue('display') == 'none') this.style.display = defaultDisplay(this.nodeName)
      })
    },

    // 用 newContent 替换掉集合中的所有元素
    replaceWith: function (newContent) {
      // 先插入新节点再删除旧节点，完成替换
      return this.before(newContent).remove()
    },

    // 在元素外层包裹一层html元素,即设置元素的父节点
    wrap: function (structure) {
      var func = isFunction(structure)
      if (this[0] && !func) {
        // 将 structure 转为 dom 元素
        var dom = $(structure).get(0),
          /**
           * 何时需要克隆
           * 存在父节点,即 structure 为页面中的元素，克隆避免影响原元素
           * 多个元素需要包裹，防止所有元素包裹在同一个元素中
           */
          clone = dom.parentNode || this.length > 1
      }

      return this.each(function (index) {
        $(this).wrapAll(
          func
            ? structure.call(this, index)
            : clone
            ? // clone dom节点及所有子节点
              dom.cloneNode(true)
            : dom
        )
      })
    },

    /**
     * 将集合中的元素包裹在 structure 中
     * 包裹后的位置在集合的第一个元素的位置
     * 如果 structure 为页面元素，则会被移动过来，所有的元素被插入在 structure 所有子元素后面
     */
    wrapAll: function (structure) {
      if (this[0]) {
        // 将 structure 插入至第一个元素的前面
        $(this[0]).before((structure = $(structure)))
        var children

        // 如果 structure 为多层元素，则在 structure 中 寻找元素的插入位置：首个子节点的首个子节点....
        while ((children = structure.children()).length) {
          structure = children.first()
        }
        // 将所有元素插入 structure 中
        $(structure).append(this)
      }
      // 返回 this 便于链式操作
      return this
    },

    // 集合中所有元素的子节点都包裹在一层dom结构中
    wrapInner: function (structure) {
      var func = isFunction(structure)
      return this.each(function (index) {
        var self = $(this),
          contents = self.contents(),
          dom = func ? structure.call(this, index) : structure
        // 含有子节点，使用 wrapAll 包裹子节点后插入，无子节点直接插入
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },

    // 子节点替换掉父节点，即移除元素的父节点，元素依然保留
    unwrap: function () {
      this.parent().each(function () {
        $(this).replaceWith($(this).children())
      })
      return this
    },

    // 克隆节点
    clone: function () {
      // true 表示复制节点的所有子节点，否则只复制当前节点
      return this.map(function () {
        return this.cloneNode(true)
      })
    },

    // 隐藏元素
    hide: function () {
      return this.css('display', 'none')
    },

    // 显示或隐藏元素
    toggle: function (setting) {
      return this.each(function () {
        var el = $(this)
        /**
         * 判断是否传入参数
         * 有参数 根据参数setting设置
         * 无参数 根据 display 当前属性值切换显示与隐藏
         */
        ;(setting === undefined ? el.css('display') == 'none' : setting) ? el.show() : el.hide()
      })
    },

    // 获取集合中每个元素的相邻的上一个兄弟节点
    prev: function (selector) {
      return $(this.pluck('previousElementSibling')).filter(selector || '*')
    },

    // 获取集合中每个元素的相邻的下一个兄弟节点
    next: function (selector) {
      return $(this.pluck('nextElementSibling')).filter(selector || '*')
    },

    // 设置或获取 html
    html: function (html) {
      /**
       * 存在 html 参数时
       * 先清空innerHTML 在 append html
       * html 参数为空时 获取集合中第一个元素中的 innerHTML
       */
      return 0 in arguments // 0 in arguments 以此判断是否存在第一个元素
        ? this.each(function (idx) {
            var originHtml = this.innerHTML
            $(this).empty().append(funcArg(this, html, idx, originHtml))
          })
        : 0 in this
        ? this[0].innerHTML
        : null
    },

    // 获取或者设置集合中所有元素的文本内容
    text: function (text) {
      return 0 in arguments
        ? // 有参数 设置
          this.each(function (idx) {
            var newText = funcArg(this, text, idx, this.textContent)
            this.textContent = newText == null ? '' : '' + newText
          })
        : // 无参数 获取 第一个元素的文本内容
        0 in this
        ? this[0].textContent
        : null
    },

    // 获取或设置dom元素属性
    attr: function (name, value) {
      var result
      return typeof name == 'string' && !(1 in arguments)
        ? !this.length || this[0].nodeType !== 1
          ? undefined
          : !(result = this[0].getAttribute(name)) && name in this[0]
          ? this[0][name]
          : result
        : this.each(function (idx) {
            if (this.nodeType !== 1) return
            if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
            else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
          })
    },

    // 移除属性
    removeAttr: function (name) {
      return this.each(function () {
        // 元素节点（element）：1，
        this.nodeType === 1 &&
          name.split(' ').forEach(function (attribute) {
            // 删除属性
            setAttribute(this, attribute)
          }, this)
      })
    },

    // 获取或设置元素的属性值
    prop: function (name, value) {
      // propMap = {
      //   tabindex: 'tabIndex',
      //   readonly: 'readOnly',
      //   for: 'htmlFor',
      //   class: 'className',
      //   maxlength: 'maxLength',
      //   cellspacing: 'cellSpacing',
      //   cellpadding: 'cellPadding',
      //   rowspan: 'rowSpan',
      //   colspan: 'colSpan',
      //   usemap: 'useMap',
      //   frameborder: 'frameBorder',
      //   contenteditable: 'contentEditable',
      // }

      // function funcArg(context, arg, idx, payload) {
      //   return isFunction(arg) ? arg.call(context, idx, payload) : arg
      // }

      // 属性映射
      name = propMap[name] || name
      return 1 in arguments
        ? // 设置参数
          this.each(function (idx) {
            this[name] = funcArg(this, value, idx, this[name])
          })
        : // 获取属性值
          this[0] && this[0][name]
    },

    // 设置或获取data数据
    data: function (name, value) {
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()
      var data = 1 in arguments ? this.attr(attrName, value) : this.attr(attrName)

      return data !== null ? deserializeValue(data) : undefined
    },

    // 获取或设置元素的值
    val: function (value) {
      return 0 in arguments
        ? // 有参数
          this.each(function (idx) {
            // 赋值value
            this.value = funcArg(this, value, idx, this.value)
          })
        : // 无参数 获取集合中第一个元素的value
          this[0] &&
            (this[0].multiple // 如果元素是 select 多选
              ? $(this[0])
                  .find('option')
                  .filter(function () {
                    return this.selected // 获取 option 中 selected 属性为 true 的 value
                  })
                  .pluck('value')
              : this[0].value)
    },

    // 获取元素的位置、宽高属性
    offset: function (coordinates) {
      if (coordinates) {
        return this.each(function (index) {
          var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top: coords.top - parentOffset.top,
              left: coords.left - parentOffset.left,
            }

          if ($this.css('position') == 'static') props['position'] = 'relative'
          $this.css(props)
        })
      }
      if (!this.length) return null

      // 没有参数则返回元素的四个属性
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height),
      }
    },

    // 添加或读取css样式
    css: function (property, value) {
      // 一个参数 获取单一属性值
      if (arguments.length < 2) {
        var computedStyle,
          element = this[0] // 元素集合中的第一个元素 为什么不是指定元素？？？
        if (!element) return
        // 元素所有的css属性与属性值
        computedStyle = getComputedStyle(element, '')
        // 一个参数 并且是字符串 获取属性值
        if (typeof property == 'string') {
          return element.style[camelize(property)] || computedStyle.getPropertyValue(property)
        } else if (isArray(property)) {
          /**
           * 多个属性组成的数组，则返回{属性：属性值}的对象形式
           * ['background-color', 'font-size']
           *  ->
           * {
           *    background-color: "rgb(255, 0, 0)",
           *    font-size: "16px"
           * }
           */
          var props = {}
          $.each(property, function (_, prop) {
            props[prop] = element.style[camelize(prop)] || computedStyle.getPropertyValue(prop)
          })
          return props
        }
        /**
         * 此处忽略一个参数 并且是对象时的情况
         * $('xxx').css({'background':'red'})
         * 放到后面设置属性时去处理
         */
      }

      var css = ''
      if (type(property) == 'string') {
        /**
         * 清除样式
         * element.css('background-color', '')
         */
        if (!value && value !== 0) {
          this.each(function () {
            this.style.removeProperty(dasherize(property))
          })
        } else {
          /**
           * 清除样式
           * element.css('background-color', '')
           */
          css = dasherize(property) + ':' + maybeAddPx(property, value)
        }
      } else {
        // 对象格式设置属性
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function () {
              this.style.removeProperty(dasherize(key))
            })
          else css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function () {
        this.style.cssText += ';' + css
      })
    },

    /**
     * 获取指定元素 element 在集合中的索引值
     * 未指定element 则获取当前元素在父元素中的索引
     */
    index: function (element) {
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },

    /**
     * 集合中是否有对象含有指定的 class
     */
    hasClass: function (name) {
      if (!name) return false
      // some 存在一个满足条件即返回true, 否则返回false
      return emptyArray.some.call(
        this,
        function (el) {
          return this.test(className(el))
        },
        classRE(name) // 第二个参数对象作为该执行回调时使用，传递给函数，用作 "this" 的值, classRE 返回正则字符串
      )
    },

    // 添加 class
    addClass: function (name) {
      if (!name) return this
      return this.each(function (idx) {
        // 无 className 属性，说明不是DOM
        if (!('className' in this)) return
        classList = []
        // 获取已有class
        var cls = className(this),
          newName = funcArg(this, name, idx, cls)

        // 空格分割class
        newName.split(/\s+/g).forEach(function (klass) {
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? ' ' : '') + classList.join(' '))
      })
    },

    // 删除 class
    removeClass: function (name) {
      return this.each(function (idx) {
        // 没有 className 不处理
        if (!('className' in this)) return
        // 不指定class，则删除所有的class
        if (name === undefined) return className(this, '')
        // 获取已有class
        classList = className(this)
        // 从className中删除 name
        funcArg(this, name, idx, classList)
          .split(/\s+/g)
          .forEach(function (klass) {
            classList = classList.replace(classRE(klass), ' ')
          })
        // 删除后重新设置className
        className(this, classList.trim())
      })
    },

    toggleClass: function (name, when) {
      if (!name) return this
      return this.each(function (idx) {
        var $this = $(this),
          names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function (klass) {
          ;(when === undefined ? !$this.hasClass(klass) : when) ? $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },

    scrollTop: function (value) {
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(
        hasScrollTop
          ? function () {
              this.scrollTop = value
            }
          : function () {
              this.scrollTo(this.scrollX, value)
            }
      )
    },

    scrollLeft: function (value) {
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      // 获取
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      // 设置
      return this.each(
        hasScrollLeft
          ? function () {
              this.scrollLeft = value
            }
          : function () {
              this.scrollTo(value, this.scrollY)
            }
      )
    },

    // 获取定位信息
    position: function () {
      if (!this.length) return
      // 获取集合中的第一个元素的信息
      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset = this.offset(),
        // rootNodeRE -> html / body
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top -= parseFloat($(elem).css('margin-top')) || 0
      offset.left -= parseFloat($(elem).css('margin-left')) || 0

      // Add offsetParent borders
      parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
      parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0

      // Subtract the two offsets
      return {
        top: offset.top - parentOffset.top,
        left: offset.left - parentOffset.left,
      }
    },

    // 找到元素第一个有定位的祖先元素
    offsetParent: function () {
      return this.map(function () {
        // dom元素自带offsetParent属性
        var parent = this.offsetParent || document.body
        // rootNodeRE -> html / body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css('position') == 'static') parent = parent.offsetParent
        return parent
      })
    },
  }

  // for now
  $.fn.detach = $.fn.remove

  // 获取元素的宽度/高度
  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function (dimension) {
    var dimensionProperty = dimension.replace(/./, function (m) {
      return m[0].toUpperCase()
    }) // width => Width, height => Height

    $.fn[dimension] = function (value) {
      var offset,
        el = this[0]
      // 无参数 获取属性值
      if (value === undefined) {
        return isWindow(el)
          ? // window 获取 innerWidth/innerHeight 值
            el['inner' + dimensionProperty]
          : isDocument(el)
          ? // document 获取 document.documentElement.[scrollWidth/scrollHeight]
            el.documentElement['scroll' + dimensionProperty]
          : // 普通节点 从 this.offset() 中获取
            (offset = this.offset()) && offset[dimension]
      }
      // 有参数 设置属性值
      else {
        return this.each(function (idx) {
          el = $(this)
          el.css(dimension, funcArg(this, value, idx, el[dimension]()))
        })
      }
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++) traverseNode(node.childNodes[i], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function (operator, operatorIndex) {
    // 内部插入
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function () {
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType,
        nodes = $.map(arguments, function (arg) {
          argType = type(arg) // 参数类型
          return argType == 'object' || argType == 'array' || arg == null ? arg : zepto.fragment(arg)
        }),
        parent,
        copyByClone = this.length > 1

      if (nodes.length < 1) return this

      return this.each(function (_, target) {
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling : operatorIndex == 1 ? target.firstChild : operatorIndex == 2 ? target : null

        var parentInDocument = $.contains(document.documentElement, parent)

        nodes.forEach(function (node) {
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target)
          if (parentInDocument)
            traverseNode(node, function (el) {
              if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' && (!el.type || el.type === 'text/javascript') && !el.src) window['eval'].call(window, el.innerHTML)
            })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function (html) {
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)
;(function ($) {
  var _zid = 1,
    undefined,
    slice = Array.prototype.slice,
    isFunction = $.isFunction,
    isString = function (obj) {
      return typeof obj == 'string'
    },
    handlers = {},
    specialEvents = {},
    focusinSupported = 'onfocusin' in window,
    focus = { focus: 'focusin', blur: 'focusout' },
    hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function (handler) {
      return handler && (!event.e || handler.e == event.e) && (!event.ns || matcher.test(handler.ns)) && (!fn || zid(handler.fn) === zid(fn)) && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return { e: parts[0], ns: parts.slice(1).sort().join(' ') }
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eventCapture(handler, captureSetting) {
    return (handler.del && !focusinSupported && handler.e in focus) || !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture) {
    var id = zid(element),
      set = handlers[id] || (handlers[id] = [])
    events.split(/\s/).forEach(function (event) {
      if (event == 'ready') return $(document).ready(fn)
      var handler = parse(event)
      handler.fn = fn
      handler.sel = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover)
        fn = function (e) {
          var related = e.relatedTarget
          if (!related || (related !== this && !$.contains(this, related))) return handler.fn.apply(this, arguments)
        }
      handler.del = delegator
      var callback = delegator || fn
      handler.proxy = function (e) {
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element) element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture) {
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function (event) {
      findHandlers(element, event, fn, selector).forEach(function (handler) {
        delete handlers[id][handler.i]
        if ('removeEventListener' in element) element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function (fn, context) {
    var args = 2 in arguments && slice.call(arguments, 2)
    if (isFunction(fn)) {
      var proxyFn = function () {
        return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments)
      }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError('expected function')
    }
  }

  $.fn.bind = function (event, data, callback) {
    return this.on(event, data, callback)
  }
  $.fn.unbind = function (event, callback) {
    return this.off(event, callback)
  }
  $.fn.one = function (event, selector, data, callback) {
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function () {
      return true
    },
    returnFalse = function () {
      return false
    },
    ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
    eventMethods = {
      preventDefault: 'isDefaultPrevented',
      stopImmediatePropagation: 'isImmediatePropagationStopped',
      stopPropagation: 'isPropagationStopped',
    }

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      $.each(eventMethods, function (name, predicate) {
        var sourceMethod = source[name]
        event[name] = function () {
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      if (source.defaultPrevented !== undefined ? source.defaultPrevented : 'returnValue' in source ? source.returnValue === false : source.getPreventDefault && source.getPreventDefault()) event.isDefaultPrevented = returnTrue
    }
    return event
  }

  function createProxy(event) {
    var key,
      proxy = { originalEvent: event }
    for (key in event) if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function (selector, event, callback) {
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function (selector, event, callback) {
    return this.off(event, selector, callback)
  }

  $.fn.live = function (event, callback) {
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function (event, callback) {
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function (event, selector, data, callback, one) {
    var autoRemove,
      delegator,
      $this = this
    if (event && !isString(event)) {
      $.each(event, function (type, fn) {
        $this.on(type, selector, data, fn, one)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false) (callback = data), (data = selector), (selector = undefined)
    if (isFunction(data) || data === false) (callback = data), (data = undefined)

    if (callback === false) callback = returnFalse

    return $this.each(function (_, element) {
      if (one)
        autoRemove = function (e) {
          remove(element, e.type, callback)
          return callback.apply(this, arguments)
        }

      if (selector)
        delegator = function (e) {
          var evt,
            match = $(e.target).closest(selector, element).get(0)
          if (match && match !== element) {
            evt = $.extend(createProxy(e), {
              currentTarget: match,
              liveFired: element,
            })
            return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
          }
        }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }
  $.fn.off = function (event, selector, callback) {
    var $this = this
    if (event && !isString(event)) {
      $.each(event, function (type, fn) {
        $this.off(type, selector, fn)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false) (callback = selector), (selector = undefined)

    if (callback === false) callback = returnFalse

    return $this.each(function () {
      remove(this, event, callback, selector)
    })
  }

  $.fn.trigger = function (event, args) {
    event = isString(event) || $.isPlainObject(event) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function () {
      // handle focus(), blur() by calling them directly
      if (event.type in focus && typeof this[event.type] == 'function') this[event.type]()
      // items in the collection might not be DOM elements
      else if ('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function (event, args) {
    var e, result
    this.each(function (i, element) {
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      $.each(findHandlers(element, event.type || event), function (i, handler) {
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout focus blur load resize scroll unload click dblclick ' + 'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' + 'change select keydown keypress keyup error').split(' ').forEach(function (event) {
    $.fn[event] = function (callback) {
      return 0 in arguments ? this.bind(event, callback) : this.trigger(event)
    }
  })

  $.Event = function (type, props) {
    if (!isString(type)) (props = type), (type = props.type)
    var event = document.createEvent(specialEvents[type] || 'Events'),
      bubbles = true
    if (props) for (var name in props) name == 'bubbles' ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true)
    return compatible(event)
  }
})(Zepto)
;(function ($) {
  var jsonpID = 0,
    document = window.document,
    key,
    name,
    rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    scriptTypeRE = /^(?:text|application)\/javascript/i,
    xmlTypeRE = /^(?:text|application)\/xml/i,
    jsonType = 'application/json',
    htmlType = 'text/html',
    blankRE = /^\s*$/,
    originAnchor = document.createElement('a')

  originAnchor.href = window.location.href

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.isDefaultPrevented()
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !--$.active) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false || triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false) return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context,
      status = 'success'
    settings.success.call(context, data, status, xhr)
    if (deferred) deferred.resolveWith(context, [data, status, xhr])
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    if (deferred) deferred.rejectWith(context, [xhr, type, error])
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function (options, deferred) {
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
      callbackName = ($.isFunction(_callbackName) ? _callbackName() : _callbackName) || 'jsonp' + ++jsonpID,
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      abort = function (errorType) {
        $(script).triggerHandler('error', errorType || 'abort')
      },
      xhr = { abort: abort },
      abortTimeout

    if (deferred) deferred.promise(xhr)

    $(script).on('load error', function (e, errorType) {
      clearTimeout(abortTimeout)
      $(script).off().remove()

      if (e.type == 'error' || !responseData) {
        ajaxError(null, errorType || 'error', xhr, options, deferred)
      } else {
        ajaxSuccess(responseData[0], xhr, options, deferred)
      }

      window[callbackName] = originalCallback
      if (responseData && $.isFunction(originalCallback)) originalCallback(responseData[0])

      originalCallback = responseData = undefined
    })

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return xhr
    }

    window[callbackName] = function () {
      responseData = arguments
    }

    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
    document.head.appendChild(script)

    if (options.timeout > 0)
      abortTimeout = setTimeout(function () {
        abort('timeout')
      }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json: jsonType,
      xml: 'application/xml, text/xml',
      html: htmlType,
      text: 'text/plain',
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true,
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return (mime && (mime == htmlType ? 'html' : mime == jsonType ? 'json' : scriptTypeRE.test(mime) ? 'script' : xmlTypeRE.test(mime) && 'xml')) || 'text'
  }

  function appendQuery(url, query) {
    if (query == '') return url
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != 'string') options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET')) (options.url = appendQuery(options.url, options.data)), (options.data = undefined)
  }

  $.ajax = function (options) {
    var settings = $.extend({}, options || {}),
      deferred = $.Deferred && $.Deferred(),
      urlAnchor
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) {
      urlAnchor = document.createElement('a')
      urlAnchor.href = settings.url
      urlAnchor.href = urlAnchor.href
      settings.crossDomain = originAnchor.protocol + '//' + originAnchor.host !== urlAnchor.protocol + '//' + urlAnchor.host
    }

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)

    var dataType = settings.dataType,
      hasPlaceholder = /\?.+=\?/.test(settings.url)
    if (hasPlaceholder) dataType = 'jsonp'

    if (settings.cache === false || ((!options || options.cache !== true) && ('script' == dataType || 'jsonp' == dataType))) settings.url = appendQuery(settings.url, '_=' + Date.now())

    if ('jsonp' == dataType) {
      if (!hasPlaceholder) settings.url = appendQuery(settings.url, settings.jsonp ? settings.jsonp + '=?' : settings.jsonp === false ? '' : 'callback=?')
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
      headers = {},
      setHeader = function (name, value) {
        headers[name.toLowerCase()] = [name, value]
      },
      protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
      xhr = settings.xhr(),
      nativeSetHeader = xhr.setRequestHeader,
      abortTimeout

    if (deferred) deferred.promise(xhr)

    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
    setHeader('Accept', mime || '*/*')
    if ((mime = settings.mimeType || mime)) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET')) setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
    xhr.setRequestHeader = setHeader

    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty
        clearTimeout(abortTimeout)
        var result,
          error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script') (1, eval)(result)
            else if (dataType == 'xml') result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
          } catch (e) {
            error = e
          }

          if (error) ajaxError(error, 'parsererror', xhr, settings, deferred)
          else ajaxSuccess(result, xhr, settings, deferred)
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
        }
      }
    }

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      ajaxError(null, 'abort', xhr, settings, deferred)
      return xhr
    }

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async, settings.username, settings.password)

    for (name in headers) nativeSetHeader.apply(xhr, headers[name])

    if (settings.timeout > 0)
      abortTimeout = setTimeout(function () {
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    if ($.isFunction(data)) (dataType = success), (success = data), (data = undefined)
    if (!$.isFunction(success)) (dataType = success), (success = undefined)
    return {
      url: url,
      data: data,
      success: success,
      dataType: dataType,
    }
  }

  $.get = function (/* url, data, success, dataType */) {
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function (/* url, data, success, dataType */) {
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function (/* url, data, success */) {
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function (url, data, success) {
    if (!this.length) return this
    var self = this,
      parts = url.split(/\s/),
      selector,
      options = parseArguments(url, data, success),
      callback = options.success
    if (parts.length > 1) (options.url = parts[0]), (selector = parts[1])
    options.success = function (response) {
      self.html(selector ? $('<div>').html(response.replace(rscript, '')).find(selector) : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope) {
    var type,
      array = $.isArray(obj),
      hash = $.isPlainObject(obj)
    $.each(obj, function (key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope : scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (type == 'array' || (!traditional && type == 'object')) serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function (obj, traditional) {
    var params = []
    params.add = function (key, value) {
      if ($.isFunction(value)) value = value()
      if (value == null) value = ''
      this.push(escape(key) + '=' + escape(value))
    }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)
;(function ($) {
  $.fn.serializeArray = function () {
    var name,
      type,
      result = [],
      add = function (value) {
        if (value.forEach) return value.forEach(add)
        result.push({ name: name, value: value })
      }
    if (this[0])
      $.each(this[0].elements, function (_, field) {
        ;(type = field.type), (name = field.name)
        if (name && field.nodeName.toLowerCase() != 'fieldset' && !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' && ((type != 'radio' && type != 'checkbox') || field.checked)) add($(field).val())
      })
    return result
  }

  $.fn.serialize = function () {
    var result = []
    this.serializeArray().forEach(function (elm) {
      result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
    })
    return result.join('&')
  }

  $.fn.submit = function (callback) {
    if (0 in arguments) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.isDefaultPrevented()) this.get(0).submit()
    }
    return this
  }
})(Zepto)
;(function ($) {
  // __proto__ doesn't exist on IE<11, so redefine
  // the Z function to use object extension instead
  if (!('__proto__' in {})) {
    $.extend($.zepto, {
      Z: function (dom, selector) {
        dom = dom || []
        $.extend(dom, $.fn)
        dom.selector = selector || ''
        dom.__Z = true
        return dom
      },
      // this is a kludge but works
      isZ: function (object) {
        return $.type(object) === 'array' && '__Z' in object
      },
    })
  }

  // getComputedStyle shouldn't freak out when called
  // without a valid element as argument
  try {
    getComputedStyle(undefined)
  } catch (e) {
    var nativeGetComputedStyle = getComputedStyle
    window.getComputedStyle = function (element) {
      try {
        return nativeGetComputedStyle(element)
      } catch (e) {
        return null
      }
    }
  }
})(Zepto)
