package com.sdb.mdm.ui.launcher

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.ImageView
import android.widget.TextView
import com.sdb.mdm.R
import com.sdb.mdm.model.AppInfo

class LauncherAppAdapter(
    private val context: Context,
    private val apps: List<AppInfo>,
    private val onAppClick: (AppInfo) -> Unit
) : BaseAdapter() {
    
    private val inflater: LayoutInflater = LayoutInflater.from(context)
    
    override fun getCount(): Int = apps.size
    
    override fun getItem(position: Int): AppInfo = apps[position]
    
    override fun getItemId(position: Int): Long = position.toLong()
    
    override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
        val view = convertView ?: inflater.inflate(R.layout.item_launcher_app, parent, false)
        val holder = view.tag as? ViewHolder ?: ViewHolder(view).also { view.tag = it }
        
        val app = apps[position]
        
        holder.appIcon.setImageDrawable(app.iconDrawable)
        holder.appName.text = app.appName
        
        view.setOnClickListener {
            onAppClick(app)
        }
        
        return view
    }
    
    private class ViewHolder(view: View) {
        val appIcon: ImageView = view.findViewById(R.id.app_icon)
        val appName: TextView = view.findViewById(R.id.app_name)
    }
}